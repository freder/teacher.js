import path from 'path';
import dotenv from 'dotenv';
const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
dotenv.config({ path: dotenvPath });

import { createServer } from 'http';

import type { Server, Socket } from 'socket.io';
import express from 'express';
import cors from 'cors';

import type { Message, AnyPayload } from '../shared/types';
import { messageTypes } from '../shared/constants';
import {
	logEtherpadEvent,
	logInfo,
	logMatrixEvent,
	logModuleEvent,
	logPresentationEvent,
	logRoomEvent,
	logWikipediaEvent
} from './logging';
import { createIoServer } from './socket';
import { initProxy } from './proxy';
import { createToken, makeAdmin } from './utils';
import { moduleStore, roomStore } from './stores';
import {
	handleAdminRole,
	handleFullStateRequest,
	defaultHandler,
} from './message-handlers';
import type { AnyAction } from 'redux';
import { actionTypes } from './constants';



const host = process.env.SERVER_HOST || 'localhost';
const port = process.env.SERVER_PORT || 3000;

type HandlerType = (action: AnyAction, socket: Socket, io: Server) => void;


function checkToken(clientId: string, token: string) {
	return (
		createToken(clientId) === token
		&& roomStore.getState().adminIds.includes(clientId)
	);
}


function wrapHandler(
	msgType: string,
	requiresAuthentication: boolean,
	handler: HandlerType,
	socket: Socket,
	io: Server,
	logFn: (...args: string[]) => void
) {
	return (msg: Message<AnyPayload>) => {
		// check if authentication is needed and valid
		if (
			requiresAuthentication && (
				!msg.authToken ||
				!checkToken(socket.id, msg.authToken)
			)
		) {
			logInfo('received', msgType, 'message without valid authentication!');
			return;
		}
		if (msg) {
			const action: AnyAction = {
				...msg,
				type: msgType,
			};
			logFn(action.type, JSON.stringify(action.payload));
			handler(action, socket, io);
		}
	};
}


function main() {
	const app = express();
	app.use(cors()); // TODO: remove in production
	const httpServer = createServer(app);

	initProxy(app);

	const io = createIoServer(httpServer);

	io.on('connection', (socket: Socket) => {
		roomStore.dispatch({
			type: actionTypes.CLIENT_CONNECTED,
			payload: { socketId: socket.id }
		});

		// first client to connect automatically becomes admin:
		const clientIds = [...io.sockets.sockets.keys()];
		if (clientIds.length === 1) {
			makeAdmin(socket, roomStore);
		}

		wsMessages.forEach(({ type, requiresAuthentication, handler, logFn }) => {
			socket.on(
				type,
				wrapHandler(
					type,
					requiresAuthentication as boolean,
					handler as HandlerType,
					socket,
					io,
					logFn as (...args: string[]) => void,
				)
			);
		});

		socket.on('disconnect', () => {
			roomStore.dispatch({
				type: actionTypes.CLIENT_DISCONNECTED,
				payload: { socketId: socket.id }
			});
		});
	});

	logInfo(`http://${host}:${port}`);
	httpServer.listen(port);
}


const wsMessages = [
	// these ones (potentially) change one or multiple of the state
	// slices, which cases the respective updated pieces of state to
	// be broadcast to all the clients.
	{
		type: messageTypes.USER_INFO,
		requiresAuthentication: false,
		handler: defaultHandler(roomStore),
		logFn: logRoomEvent,
	},
	{
		type: messageTypes.SET_ACTIVE_MODULE,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logModuleEvent,
	},
	{
		type: messageTypes.REVEAL_STATE_CHANGED,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logPresentationEvent,
	},
	{
		type: messageTypes.START_PRESENTATION,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logPresentationEvent,
	},
	{
		type: messageTypes.END_PRESENTATION,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logPresentationEvent,
	},
	{
		type: messageTypes.REVEAL_URL_CHANGED,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logPresentationEvent,
	},
	{
		type: messageTypes.WIKIPEDIA_URL_CHANGED,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logWikipediaEvent,
	},
	{
		type: messageTypes.MATRIX_ROOM_CHANGE,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logMatrixEvent,
	},
	{
		type: messageTypes.ETHERPAD_DOC_CHANGE,
		requiresAuthentication: true,
		handler: defaultHandler(moduleStore),
		logFn: logEtherpadEvent,
	},

	// these ones are only between client and server
	{
		type: messageTypes.CLAIM_ADMIN_ROLE,
		requiresAuthentication: false,
		handler: handleAdminRole,
		logFn: () => {},
	},
	{
		type: messageTypes.GET_FULL_STATE,
		requiresAuthentication: false,
		handler: handleFullStateRequest,
		logFn: () => {},
	},
];


main();
export {};
