import type { Socket } from 'socket.io';
import type { AnyAction, Store } from 'redux';

import type {
	Message,
	ClaimAdminRolePayload,
	AuthTokenPayload,
} from '../shared/types';
import { messageTypes } from '../shared/constants';
import { roomStore, moduleStore } from './stores';
import { makeAdmin, emitState } from './utils';


export const defaultHandler = (store: Store) => (
	action: AnyAction,
	// socket: Socket,
	// io: Server
): void => {
	store.dispatch(action);
};


export function handleFullStateRequest(
	action: AnyAction,
	socket: Socket,
	// io: Server
): void {
	emitState(
		socket, roomStore.getState(), messageTypes.ROOM_UPDATE
	);
	emitState(
		socket, moduleStore.getState(), messageTypes.MODULE_UPDATE
	);
}


export function handleAdminRole(
	action: AnyAction,
	socket: Socket,
	// io: Server
): void {
	const { secret } = action.payload as ClaimAdminRolePayload;
	if (process.env.SECRET === secret) {
		makeAdmin(socket, roomStore);
	} else {
		const msg: Message<AuthTokenPayload> = {
			payload: { token: null }
		};
		socket.emit(messageTypes.ADMIN_TOKEN, msg);
	}
}
