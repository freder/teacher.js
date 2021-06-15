import type { ModuleState, RevealState, RoomState } from './types';

export const messageTypes = {
	CLAIM_ADMIN_ROLE: 'CLAIM_ADMIN_ROLE',
	ADMIN_TOKEN: 'ADMIN_TOKEN',
	GET_FULL_STATE: 'GET_FULL_STATE',
	USER_INFO: 'USER_INFO',
	ROOM_UPDATE: 'ROOM_UPDATE',
	MODULE_UPDATE: 'MODULE_UPDATE',
	SET_ACTIVE_MODULE: 'SET_ACTIVE_MODULE',
	REVEAL_STATE_CHANGED: 'reveal-state-change',
	REVEAL_WIKIPEDIA_LINK: 'REVEAL_WIKIPEDIA_LINK',
	START_PRESENTATION: 'START_PRESENTATION',
	END_PRESENTATION: 'END_PRESENTATION',
	URL_CHANGED: 'URL_CHANGED',
	WIKIPEDIA_SECTION_CHANGED: 'WIKIPEDIA_SECTION_CHANGED',
	MATRIX_ROOM_CHANGE: 'MATRIX_ROOM_CHANGE',
	HYDROGEN_READY: 'HYDROGEN_READY',
};

export const moduleTypes = {
	PRESENTATION: 'PRESENTATION',
	WIKIPEDIA: 'WIKIPEDIA',
	CHAT: 'CHAT',
};

// TODO: use env var
export const janusRoomId = 1234;
// TODO: use env var
export const matrixRoomId = '!MnnWYJyaHwOLoMoWZV:m3x.baumhaus.digital';
// TODO: use env var
export const wikipediaBaseUrl = 'https://en.wikipedia.org';
// TODO: use env var
export const kastaliaBaseUrl = 'https://kastalia.medienhaus.udk-berlin.de';
export const hydrogenBaseUrl = process.env.HYDROGEN_URL;

export const proxyPathWikipedia = 'proxy/wikipedia';
export const proxyPathKastalia = 'proxy/kastalia';

export const initialRoomState: RoomState = {
	adminIds: [],
	users: [],
};

export const initialModuleState: ModuleState = {
	activeModule: moduleTypes.CHAT,
	matrixRoomId,
	url: null,
	presentationState: {
		state: {}
	},
};
