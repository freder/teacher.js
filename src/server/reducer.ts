import * as R from 'ramda';
import type { AnyAction } from 'redux';

import {
	initialModuleState,
	initialRoomState,
	messageTypes
} from '../shared/constants';
import type {
	ActiveModulePayload,
	MatrixRoomPayload,
	Message,
	ModuleState,
	PresentationStartPayload,
	RevealStateChangePayload,
	RoomState,
	UrlPayload,
	UserInfo
} from '../shared/types';
import { actionTypes, logIndent } from './constants';
import { logBroadcast, logConnectionEvent, logRedux } from './logging';
import { getIo } from './socket';
import { emitState } from './utils';


interface ConnectionPayload {
	socketId: string,
}


function logAction(action: AnyAction) {
	if (!action.type.startsWith('@@')) {
		logRedux(
			action.type,
			JSON.stringify(action.payload, null, logIndent)
		);
	}
}


function logUnhandled(action: AnyAction) {
	if (!action.type.startsWith('@@')) {
		logRedux('unhandled action type:', action.type);
	}
}


export function roomReducer(
	state=initialRoomState,
	action: AnyAction
): RoomState {
	logAction(action);
	let newState = state;
	let broadcast = true; // eslint-disable-line prefer-const

	switch (action.type) {
		case actionTypes.CLIENT_CONNECTED: {
			const { socketId } = action.payload as ConnectionPayload;
			logConnectionEvent('client connected:', socketId);
			const user: UserInfo = {
				socketId: socketId,
				name: null
			};
			newState = {
				...state,
				users: [...state.users, user],
			};
			break;
		}

		case actionTypes.CLIENT_DISCONNECTED: {
			const { socketId } = action.payload as ConnectionPayload;
			logConnectionEvent('client disconnected:', socketId);
			const adminIds = R.without([socketId], state.adminIds);
			const users = R.without(
				state.users.filter(
					(user) => user.socketId === socketId
				),
				state.users
			);
			newState = {
				...state,
				users,
				adminIds,
			};
			break;
		}

		case actionTypes.UPDATE_ADMINS: {
			newState = {
				...state,
				adminIds: action.adminIds
			};
			break;
		}

		case messageTypes.USER_INFO: {
			const userInfo = action.payload as UserInfo;
			const i = R.findIndex(
				R.propEq('socketId', userInfo.socketId),
				state.users
			);
			const updatedUsers = R.update(
				i,
				{ ...state.users[i], ...userInfo },
				state.users
			);
			newState = {
				...state,
				users: updatedUsers,
			};
			break;
		}

		default: {
			logUnhandled(action);
		}
	}

	// by default: broadcast entire state slice
	if (newState !== state && broadcast) {
		emitState(
			getIo(), newState, messageTypes.ROOM_UPDATE, logBroadcast
		);
	}

	return newState;
}


export function moduleReducer(
	state=initialModuleState,
	action: AnyAction
): ModuleState {
	logAction(action);
	let newState = state;
	let broadcast = true; // eslint-disable-line prefer-const

	switch (action.type) {
		case messageTypes.SET_ACTIVE_MODULE: {
			const { activeModule } = action.payload as ActiveModulePayload;
			newState = { ...state, activeModule };
			break;
		}

		case messageTypes.REVEAL_URL_CHANGED: {
			const { url } = action.payload as UrlPayload;
			newState = R.assocPath(['presentationState', 'url'], url, state);
			break;
		}

		case messageTypes.WIKIPEDIA_URL_CHANGED: {
			const { url } = action.payload as UrlPayload;
			newState = R.assocPath(['wikipediaState', 'url'], url, state);
			break;
		}

		case messageTypes.MATRIX_ROOM_CHANGE: {
			const { roomId } = action.payload as MatrixRoomPayload;
			newState = R.assocPath(['chatState', 'matrixRoomId'], roomId, state);
			break;
		}

		case messageTypes.REVEAL_STATE_CHANGED: {
			const payload = action.payload as RevealStateChangePayload;
			newState = R.assocPath(['presentationState', 'state'], payload.state, state);
			const msg: Message<RevealStateChangePayload> = {
				payload: newState.presentationState
			};
			getIo().emit(
				messageTypes.REVEAL_STATE_CHANGED,
				msg
			);
			broadcast = false;
			break;
		}

		case messageTypes.START_PRESENTATION: {
			const payload = action.payload as PresentationStartPayload;
			newState = R.assocPath(['presentationState', 'url'], payload.url, state);
			break;
		}

		case messageTypes.END_PRESENTATION: {
			newState = {
				...state,
				presentationState: initialModuleState.presentationState,
			};
			break;
		}

		default: {
			logUnhandled(action);
		}
	}

	// by default: broadcast entire state slice
	if (newState !== state && broadcast) {
		emitState(
			getIo(), newState, messageTypes.MODULE_UPDATE, logBroadcast
		);
	}

	return newState;
}
