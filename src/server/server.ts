import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

import { Server, Socket } from 'socket.io';
import debug from 'debug';
import dotenv from 'dotenv';
import * as R from 'ramda';
import { observable, observe } from 'mobx';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

import type {
	Message,
	Payload,
	PresentationStartPayload,
	PresentationState,
	RevealStateChangePayload,
	RoomState,
	User
} from '../shared/types';
import { messageTypes } from '../shared/constants';


const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
dotenv.config({ path: dotenvPath });

const host = process.env.SERVER_HOST || 'localhost';
const port = process.env.SERVER_PORT || 3000;
let io: Server;

const debugPrefix = 'T.S';
const logSlideCmd = debug(`${debugPrefix}:cmd:slides`);
const logNetEvent = debug(`${debugPrefix}:net`);
const logInfo = debug(`${debugPrefix}:info`);
// const logAuth = debug(`${debugPrefix}:auth`);


const initialRoomState: RoomState = {
	adminIds: [],
	users: [],
	activeModule: undefined,
	presentationUrl: undefined,
	wikipediaUrl: undefined,
};
const roomStateData = { ...initialRoomState } as RoomState;

const initialPresentationState: PresentationState = {
	state: {
		indexh: 0,
		indexv: 0,
		paused: false,
		overview: false,
	}
};
const presentationStateData = { ...initialPresentationState } as PresentationState;

const roomState = observable(roomStateData);
observe(roomState, (/* change */) => {
	// if (change.type === 'update') {
	io.emit(
		messageTypes.ROOM_UPDATE,
		roomState
	);
	// }
});

const presentationState = observable(presentationStateData);
observe(presentationState, (/* change */) => {
	// if (change.type === 'update') {
	io.emit(
		messageTypes.REVEAL_STATE_CHANGED,
		presentationState
	);
	// }
});


// adapted from https://github.com/reveal/multiplex/blob/master/index.js
function createToken(clientId: string) {
	const hash = crypto.createHash('sha256');
	hash.update(`${process.env.SECRET}${clientId}`);
	return hash.digest('hex');
}


function checkToken(clientId: string, token: string) {
	return (
		createToken(clientId) === token
		&& roomState.adminIds.includes(clientId)
	);
}


function makeAdmin(socket: Socket) {
	const token = createToken(socket.id);
	socket.emit(messageTypes.ADMIN_TOKEN, { token });
	roomState.adminIds = [socket.id];
}


function requireAuth(
	socket: Socket,
	handler: (payload: Payload) => void
) {
	return (msg: Message) => {
		if (!msg.authToken) {
			return;
		}
		if (!checkToken(socket.id, msg.authToken)) {
			// logAuth(
			// 	`not authorized: ${socket.id}`,
			// 	JSON.stringify(msg, null, '  ')
			// );
			return;
		}
		handler(msg.payload);
	};
}


function handleRevealStateChange(payload: RevealStateChangePayload) {
	logSlideCmd(JSON.stringify(payload));
	presentationState.state = payload.state;
}


function handlePresentationStart(payload: PresentationStartPayload) {
	roomState.presentationUrl = payload.url;
}


function handlePresentationEnd() {
	roomState.presentationUrl = undefined;
	presentationState.state = { ...initialPresentationState.state };
}


function handleWikipediaUrl(payload: Record<string, unknown>) {
	roomState.wikipediaUrl = payload.url as string;
}


function handleActiveModule(payload: Record<string, unknown>) {
	roomState.activeModule = payload.activeModule as string;
}


function main() {
	const app = express();
	app.use(cors()); // TODO: remove in production
	const httpServer = createServer(app);

	// generic proxy to avoid CORS, etc.
	app.get('/proxy/:url', (req, res) => {
		const urlStr = decodeURIComponent(req.params.url);
		fetch(urlStr)
			.then((res) => res.text())
			.then((txt) => res.send(txt));
	});

	// to proxy a website in order to inject custom js code
	// http://0.0.0.0:3000/proxy/inject-snippet/wikipedia/https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FDocumentary_Now!
	// app.get('/proxy/inject-snippet/wikipedia/:url', (req, res) => {
	// 	const urlStr = decodeURIComponent(req.params.url);
	// 	const url = new URL(urlStr);
	// 	const snippet = '<script>alert(123);</script>'
	// 	fetch(urlStr)
	// 		.then((res) => res.text())
	// 		.then((htmlStr) => {
	// 			const output = htmlStr
	// 				.replace(
	// 					'</head>',
	// 					`<base href="${url.origin}"></head>`
	// 				)
	// 				.replace(/src="\/(\w)/ig, `src="${url.origin}/$1`)
	// 				.replace(/href="\/(\w)/ig, `href="${url.origin}/$1`)
	// 				.replace('</body>', `${snippet}</body>`);
	// 			res.send(output);
	// 		});
	// });

	io = new Server(
		httpServer,
		{
			serveClient: false,
			cors: {
				origin: '*', // TODO: tighten security
				methods: ['GET', 'POST'],
			}
		}
	);

	io.on('connection', (socket: Socket) => {
		logNetEvent('client connected:', socket.id);
		const user: User = {
			socketId: socket.id,
			name: null
		};
		roomState.users = [...roomState.users, user];

		// first client to connect automatically becomes admin:
		const clientIds = [...io.sockets.sockets.keys()];
		if (clientIds.length === 1) {
			makeAdmin(socket);
		}

		// whoever knows the secret can claim the room
		socket.on(messageTypes.CLAIM_ADMIN_ROLE, ({ secret }) => {
			if (process.env.SECRET === secret) {
				makeAdmin(socket);
			} else {
				socket.emit(messageTypes.ADMIN_TOKEN, false);
			}
		});

		socket.on(messageTypes.USER_INFO, (userInfo) => {
			// console.log(userInfo);
			const i = R.findIndex(
				R.propEq('socketId', socket.id),
				roomState.users
			);
			roomState.users = R.update(
				i,
				R.assoc('name', userInfo.name, roomState.users[i]),
				roomState.users
			);
		});

		socket.on(
			messageTypes.SET_ACTIVE_MODULE,
			requireAuth(socket, handleActiveModule)
		);

		socket.on(
			messageTypes.REVEAL_STATE_CHANGED,
			requireAuth(socket, handleRevealStateChange)
		);

		socket.on(
			messageTypes.START_PRESENTATION,
			requireAuth(socket, handlePresentationStart)
		);

		socket.on(
			messageTypes.END_PRESENTATION,
			requireAuth(socket, handlePresentationEnd)
		);

		socket.on(
			messageTypes.SET_WIKIPEDIA_URL,
			requireAuth(socket, handleWikipediaUrl)
		);

		socket.on(messageTypes.BRING_ME_UP_TO_SPEED, () => {
			socket.emit(messageTypes.ROOM_UPDATE, roomState);
			socket.emit(messageTypes.REVEAL_STATE_CHANGED, presentationState);
		});

		socket.on('disconnect', () => {
			logNetEvent('client disconnected:', socket.id);
			roomState.adminIds = R.without(
				[socket.id],
				roomState.adminIds
			);
			roomState.users = R.without(
				roomState.users.filter((user) => user.socketId === socket.id),
				roomState.users
			);
		});
	});

	logInfo(`http://${host}:${port}`);
	httpServer.listen(port);
}


main();
export {};
