import crypto from 'crypto';

import type { Store } from 'redux';
import type { Server, Socket } from 'socket.io';

import { messageTypes } from '../shared/constants';
import type {
	AuthTokenPayload,
	Message,
	AnyPayload,
	ModuleState,
	RoomState,
} from '../shared/types';
import { actionTypes, logIndent } from './constants';


// adapted from https://github.com/reveal/multiplex/blob/master/index.js
export function createToken(clientId: string): string {
	const hash = crypto.createHash('sha256');
	hash.update(`${process.env.SECRET}${clientId}`);
	return hash.digest('hex');
}


export function makeAdmin(socket: Socket, roomStore: Store): void {
	const token = createToken(socket.id);
	const msg: Message<AuthTokenPayload> = {
		payload: { token }
	};
	socket.emit(
		messageTypes.ADMIN_TOKEN,
		msg
	);
	roomStore.dispatch({
		type: actionTypes.UPDATE_ADMINS,
		adminIds: [socket.id]
	});
}


export function emitState(
	socketOrIo: Server | Socket,
	state: ModuleState | RoomState,
	msgType: string,
	logFn?: (...args: string[]) => void
): void {
	const msg: Message<AnyPayload> = { payload: state };
	if (logFn) {
		logFn(msgType, JSON.stringify(msg, null, logIndent));
	}
	socketOrIo.emit(msgType, msg);
}
