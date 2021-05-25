import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

import { Server, Socket } from 'socket.io';
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
	UserInfo,
	ActiveModulePayload,
	WikipediaUrlPayload,
	ClaimAdminRolePayload
} from '../shared/types';
import { messageTypes } from '../shared/constants';
import {
	logSlideCmd,
	logNetEvent,
	logInfo
} from './logging';


const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
dotenv.config({ path: dotenvPath });

const host = process.env.SERVER_HOST || 'localhost';
const port = process.env.SERVER_PORT || 3000;
let io: Server;


type HandlerType = (msgType: string, payload: Payload, socket: Socket) => void;

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
	msgType: string,
	requiresAuthentication: boolean,
	handler: HandlerType
) {
	return (msg: Message<Payload>) => {
		if (
			requiresAuthentication &&
			(
				!msg.authToken ||
				!checkToken(socket.id, msg.authToken)
			)
		) {
			return;
		}
		handler(msgType, msg.payload, socket);
	};
}


function handleRevealStateChange(msgType: string, pl: Payload) {
	const payload = pl as RevealStateChangePayload;
	logSlideCmd(JSON.stringify(payload));
	presentationState.state = payload.state;
}


function handlePresentationStart(msgType: string, pl: Payload) {
	const payload = pl as PresentationStartPayload;
	roomState.presentationUrl = payload.url;
}


function handlePresentationEnd() {
	roomState.presentationUrl = undefined;
	presentationState.state = { ...initialPresentationState.state };
}


function handleWikipediaUrl(msgType: string, pl: Payload) {
	const payload = pl as WikipediaUrlPayload;
	roomState.wikipediaUrl = payload.url;
}


function handleActiveModule(msgType: string, pl: Payload) {
	const payload = pl as ActiveModulePayload;
	roomState.activeModule = payload.activeModule;
}


const handleAdminRole = (msgType: string, pl: Payload, socket: Socket) => {
	const { secret } = pl as ClaimAdminRolePayload;
	if (process.env.SECRET === secret) {
		makeAdmin(socket);
	} else {
		socket.emit(messageTypes.ADMIN_TOKEN, false);
	}
};


const handleUserInfo = (msgType: string, pl: Payload, socket: Socket) => {
	const userInfo = pl as UserInfo;
	const i = R.findIndex(
		R.propEq('socketId', socket.id),
		roomState.users
	);
	roomState.users = R.update(
		i,
		R.assoc('name', userInfo.name, roomState.users[i]),
		roomState.users
	);
};


const handleUpToSpeed = (msgType: string, pl: Payload, socket: Socket) => {
	socket.emit(messageTypes.ROOM_UPDATE, roomState);
	socket.emit(messageTypes.REVEAL_STATE_CHANGED, presentationState);
};


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
		const user: UserInfo = {
			socketId: socket.id,
			name: null
		};
		roomState.users = [...roomState.users, user];

		// first client to connect automatically becomes admin:
		const clientIds = [...io.sockets.sockets.keys()];
		if (clientIds.length === 1) {
			makeAdmin(socket);
		}

		const events = [
			{
				type: messageTypes.CLAIM_ADMIN_ROLE,
				args: [false, handleAdminRole]
			},
			{
				type: messageTypes.USER_INFO,
				args: [false, handleUserInfo]
			},
			{
				type: messageTypes.SET_ACTIVE_MODULE,
				args: [true, handleActiveModule]
			},
			{
				type: messageTypes.REVEAL_STATE_CHANGED,
				args: [true, handleRevealStateChange]
			},
			{
				type: messageTypes.START_PRESENTATION,
				args: [true, handlePresentationStart]
			},
			{
				type: messageTypes.END_PRESENTATION,
				args: [true, handlePresentationEnd]
			},
			{
				type: messageTypes.SET_WIKIPEDIA_URL,
				args: [true, handleWikipediaUrl]
			},
			{
				type: messageTypes.BRING_ME_UP_TO_SPEED,
				args: [false, handleUpToSpeed]
			},
		];
		events.forEach(({ type, args }) => {
			socket.on(
				type,
				requireAuth(
					socket,
					type,
					args[0] as boolean,
					args[1] as HandlerType,
				)
			);
		});

		socket.on('disconnect', () => {
			logNetEvent('client disconnected:', socket.id);
			roomState.adminIds = R.without(
				[socket.id],
				roomState.adminIds
			);
			roomState.users = R.without(
				roomState.users.filter(
					(user) => user.socketId === socket.id
				),
				roomState.users
			);
		});
	});

	logInfo(`http://${host}:${port}`);
	httpServer.listen(port);
}


main();
export {};
