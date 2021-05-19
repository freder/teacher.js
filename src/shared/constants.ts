export const messageTypes = {
	CLAIM_ADMIN_ROLE: 'CLAIM_ADMIN_ROLE',
	ADMIN_TOKEN: 'ADMIN_TOKEN',
	REVEAL_STATE_CHANGED: 'reveal-state-change',
	ROOM_UPDATE: 'ROOM_UPDATE',
	USER_INFO: 'USER_INFO',
	BRING_ME_UP_TO_SPEED: 'BRING_ME_UP_TO_SPEED',
	START_PRESENTATION: 'START_PRESENTATION',
	END_PRESENTATION: 'END_PRESENTATION',
	SET_WIKIPEDIA_URL: 'SET_WIKIPEDIA_URL',
	SET_ACTIVE_MODULE: 'SET_ACTIVE_MODULE',
};

export const moduleTypes = {
	PRESENTATION: 'PRESENTATION',
	WIKIPEDIA: 'WIKIPEDIA',
};

export const janusServers = [
	// TODO: check if these are correct
	'wss://0.teacher.solar:8188/',
	'ws://0.teacher.solar:8188/',
	'http://0.teacher.solar:8088/janus'
];
export const janusRoomId = 1234;
