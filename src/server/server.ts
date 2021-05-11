import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto';

import { Server, Socket } from 'socket.io';
import debug from 'debug';
import dotenv from 'dotenv';
import * as R from 'ramda';
import express from 'express';
import fetch from 'node-fetch';

import {
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


function handleRevealStateChange(payload: RevealStateChangePayload) {
	logSlideCmd(JSON.stringify(payload));
	// relay to all clients:
	io.emit(messageTypes.REVEAL_STATE_CHANGED, payload);
}


function main() {
	const app = express();
	const httpServer = createServer(app);

	// to proxy a website in order to inject custom js code
	// http://0.0.0.0:3000/inject/https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FDocumentary_Now!
	app.get('/inject/:url', (req, res) => {
		const urlStr = decodeURIComponent(req.params.url);
		const url = new URL(urlStr);
		fetch(urlStr)
			.then((res) => res.text())
			.then((htmlStr) => {
				const output = htmlStr
					.replace(
						'</head>',
						`<base href="${url.origin}"></head>`
					)
					.replace(/src="\/(\w)/ig, `src="${url.origin}/$1`)
					.replace(/href="\/(\w)/ig, `href="${url.origin}/$1`)
					.replace(
						'</body>',
						'<script>alert(123);</script></body>'
					);
				res.send(output);
			});
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
			messageTypes.REVEAL_STATE_CHANGED,
			requireAuth(socket, handleRevealStateChange)
		);

		socket.on('disconnect', () => {
			logNetEvent('client disconnected:', socket.id);
			adminIds = R.without([socket.id], adminIds);
		});
	});

	logInfo(`http://${host}:${port}`);
	httpServer.listen(port);
}


main();
export {};
