import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

import { Server, Socket } from 'socket.io';
import debug from 'debug';
import dotenv from 'dotenv';
import * as R from 'ramda';

import { SlideEventData } from '../shared/types';
import { messageTypes } from '../shared/constants';


const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
dotenv.config({ path: dotenvPath });

const port = process.env.SERVER_PORT || 3000;

const debugPrefix = 'T.S';
const logSlideCmd = debug(`${debugPrefix}:cmd:slides`);
const logNetEvent = debug(`${debugPrefix}:net`);
const logInfo = debug(`${debugPrefix}:info`);


let adminIds: Array<string> = [];


function createToken(clientId: string) {
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


function main() {
	const httpServer = createServer();
	const io = new Server(
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

		// TODO: check if it comes from an admin user
		socket.on(messageTypes.SLIDE_EVENT, (payload: SlideEventData) => {
			logSlideCmd(JSON.stringify(payload));

			const { type, index, authToken } = payload;
			if (!checkToken(socket.id, authToken)) {
				return;
			}

			// relay to all clients:
			switch (type) {
				case messageTypes.SLIDE_CHANGED: {
					io.emit(messageTypes.SLIDE_CHANGED, index);
				}
			}
		});

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
