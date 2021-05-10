import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

import { Server, Socket } from 'socket.io';
import debug from 'debug';
import dotenv from 'dotenv';
import * as R from 'ramda';

import {
	Message,
	Payload,
	SlideEventPayload
} from '../shared/types';
import { messageTypes } from '../shared/constants';


const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
dotenv.config({ path: dotenvPath });

const port = process.env.SERVER_PORT || 3000;
let io: Server;

const debugPrefix = 'T.S';
const logSlideCmd = debug(`${debugPrefix}:cmd:slides`);
const logNetEvent = debug(`${debugPrefix}:net`);
const logInfo = debug(`${debugPrefix}:info`);


let adminIds: Array<string> = [];


function createToken(clientId: string) {
	// adapted from https://github.com/reveal/multiplex/blob/master/index.js
	const cipher = crypto.createCipheriv('blowfish', clientId, process.env.SECRET);
	return cipher.final('hex');
}


function checkToken(clientId: string, token: string) {
	return (
		createToken(clientId) === token
		&& adminIds.includes(clientId)
	);
}


function makeAdmin(socket: Socket) {
	const token = createToken(socket.id);
	socket.emit(messageTypes.ADMIN_TOKEN, { token });
	adminIds = [socket.id];
}


function requireAuth(
	socket: Socket,
	handler: (payload: Payload) => void
) {
	return (msg: Message) => {
		if (!checkToken(socket.id, msg.authToken)) {
			// socket.emit('__error__', { message: 'not authorized' });
			return;
		}
		handler(msg.payload);
	};
}


function handleSlideStateChange(payload: SlideEventPayload) {
	logSlideCmd(JSON.stringify(payload));
	const { type, index } = payload;

	// relay to all clients:
	switch (type) {
		case messageTypes.SLIDE_CHANGED: {
			io.emit(messageTypes.SLIDE_CHANGED, index);
		}
	}
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

		socket.on(
			messageTypes.SLIDE_EVENT,
			requireAuth(socket, handleSlideStateChange)
		);

		socket.on('disconnect', () => {
			logNetEvent('client disconnected:', socket.id);
			adminIds = R.without([socket.id], adminIds);
		});
	});

	logInfo(`http://localhost:${port}`);
	httpServer.listen(port);
}


main();
export {};
