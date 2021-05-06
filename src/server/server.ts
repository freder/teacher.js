import { createServer } from 'http';
import path from 'path';

import { Server, Socket } from 'socket.io';
import debug from 'debug';
import dotenv from 'dotenv';

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


function main() {
	const httpServer = createServer();
	const io = new Server(
		httpServer,
		{
			serveClient: false,
			// TODO: tighten security
			cors: {
				origin: '*',
				methods: ['GET', 'POST'],
			}
		}
	);

	io.on('connection', (socket: Socket) => {
		logNetEvent('client connected:', socket.id);
		// io.to(socket.id).emit('hello', `oh, hey ${socket.id}`);

		// client may request admin role
		socket.on('request-role:admin', () => {
			socket.emit('grant-role:admin');
		});

		// TODO: check if it comes from an admin user
		socket.on(messageTypes.SLIDE_EVENT, (msg: SlideEventData) => {
			logSlideCmd(JSON.stringify(msg));

			// relay to all clients:
			switch (msg.type) {
				case messageTypes.SLIDE_CHANGED: {
					io.emit(messageTypes.SLIDE_CHANGED, msg.index);
				}
			}
		});
	});

	logInfo(`http://localhost:${port}`);
	httpServer.listen(port);
}


main();
export {};
