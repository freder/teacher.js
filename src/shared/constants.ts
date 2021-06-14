import type { ModuleState, RoomState } from './types';

export const messageTypes = {
	CLAIM_ADMIN_ROLE: 'CLAIM_ADMIN_ROLE',
	ADMIN_TOKEN: 'ADMIN_TOKEN',
	GET_FULL_STATE: 'GET_FULL_STATE',
	USER_INFO: 'USER_INFO',
	ROOM_UPDATE: 'ROOM_UPDATE',
	MODULE_UPDATE: 'MODULE_UPDATE',
	SET_ACTIVE_MODULE: 'SET_ACTIVE_MODULE',
	REVEAL_STATE_CHANGED: 'reveal-state-change',
	START_PRESENTATION: 'START_PRESENTATION',
	END_PRESENTATION: 'END_PRESENTATION',
	URL_CHANGED: 'URL_CHANGED',
	WIKIPEDIA_SECTION_CHANGED: 'WIKIPEDIA_SECTION_CHANGED',
	MATRIX_ROOM_CHANGE: 'MATRIX_ROOM_CHANGE',
};

export const moduleTypes = {
	PRESENTATION: 'PRESENTATION',
	WIKIPEDIA: 'WIKIPEDIA',
	CHAT: 'CHAT',
};

// TODO: use env var
export const janusRoomId = 1234;

export const proxyPathWikipedia = 'proxy/wikipedia';

// TODO: use env var
export const matrixRoomId = '!MnnWYJyaHwOLoMoWZV:m3x.baumhaus.digital';

export const initialRoomState: RoomState = {
	adminIds: [],
	users: [],
};

export const initialModuleState: ModuleState = {
	activeModule: moduleTypes.CHAT,
	matrixRoomId,
	url: null,
	presentationState: {
		state: null
	},
};
