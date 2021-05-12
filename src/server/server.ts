import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

import { Server, Socket } from 'socket.io';
import debug from 'debug';
import dotenv from 'dotenv';
import * as R from 'ramda';

import type {
	Message,
	Payload,
	RevealStateChangePayload
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
const logAuth = debug(`${debugPrefix}:auth`);


type User = {
	socketId: string,
	name: string,
};

type RoomState = {
	adminIds: Array<string>,
	users: Array<User>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	revealState: any,
};

const stateData: RoomState = {
	adminIds: [],
	users: [],
	// TODO: split up in to two state objects?
	revealState: {},
};

// proxy object intercepts "set" operations, so that we can
// react to property changes
const state = new Proxy(
	stateData,
	{
		set(target, _prop, value/* , receiver */) {
			const prop = _prop as (keyof RoomState);
			if (prop === 'adminIds') {
				console.log('list of admins changed:');
				console.log(state.adminIds);
				console.log('↓');
				console.log(value);
			} else if (prop === 'users') {
				console.log('list of users changed:');
				console.log(state.users);
				console.log('↓');
				console.log(value);
			} /* else if (prop === 'revealState') {
				//
			} */
			target[prop] = value;

			if (['adminIds', 'users'].includes(prop)) {
				io.emit(
					messageTypes.ROOM_UPDATE,
					R.pick(['adminIds', 'users'], target)
				);
			}

			return true;
		}
	}
);


// adapted from https://github.com/reveal/multiplex/blob/master/index.js
function createToken(clientId: string) {
	const hash = crypto.createHash('sha256');
	hash.update(`${process.env.SECRET}${clientId}`);
	return hash.digest('hex');
}


function checkToken(clientId: string, token: string) {
	return (
		createToken(clientId) === token
		&& state.adminIds.includes(clientId)
	);
}


function makeAdmin(socket: Socket) {
	const token = createToken(socket.id);
	socket.emit(messageTypes.ADMIN_TOKEN, { token });
	state.adminIds = [socket.id];
}


function requireAuth(
	socket: Socket,
	handler: (payload: Payload) => void
) {
	return (msg: Message) => {
		if (!checkToken(socket.id, msg.authToken)) {
			logAuth(
				`not authorized: ${socket.id}`,
				JSON.stringify(msg, null, '  ')
			);
			return;
		}
		handler(msg.payload);
	};
}


function handleRevealStateChange(payload: RevealStateChangePayload) {
	logSlideCmd(JSON.stringify(payload));
	state.revealState = payload.state;
	// relay to all clients:
	io.emit(messageTypes.REVEAL_STATE_CHANGED, payload);
}


function main() {
	const httpServer = createServer();
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
			name: 'anonymous'
		};
		state.users = [...state.users, user];

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
			console.log(userInfo);
			const i = R.findIndex(
				R.propEq('socketId', socket.id),
				state.users
			);
			state.users = R.update(
				i,
				R.assoc('name', userInfo.name, state.users[i]),
				state.users
			);
		});

		socket.on(
			messageTypes.REVEAL_STATE_CHANGED,
			requireAuth(socket, handleRevealStateChange)
		);

		socket.on('disconnect', () => {
			logNetEvent('client disconnected:', socket.id);
			state.adminIds = R.without(
				[socket.id],
				state.adminIds
			);
			state.users = R.without(
				state.users.filter((user) => user.socketId === socket.id),
				state.users
			);
		});
	});

	logInfo(`http://${host}:${port}`);
	httpServer.listen(port);
}


main();
export {};
