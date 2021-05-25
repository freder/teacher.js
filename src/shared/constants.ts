export const messageTypes = {
	CLAIM_ADMIN_ROLE: 'CLAIM_ADMIN_ROLE',
	ADMIN_TOKEN: 'ADMIN_TOKEN',
	BRING_ME_UP_TO_SPEED: 'BRING_ME_UP_TO_SPEED',
	USER_INFO: 'USER_INFO',
	ROOM_UPDATE: 'ROOM_UPDATE',

	SET_ACTIVE_MODULE: 'SET_ACTIVE_MODULE',
	REVEAL_STATE_CHANGED: 'reveal-state-change',
	START_PRESENTATION: 'START_PRESENTATION',
	END_PRESENTATION: 'END_PRESENTATION',
	SET_WIKIPEDIA_URL: 'SET_WIKIPEDIA_URL',
};

export const moduleTypes = {
	PRESENTATION: 'PRESENTATION',
	WIKIPEDIA: 'WIKIPEDIA',
};

// TODO: does not need to be shared with the server
// https://janus.conf.meetecho.com/docs/deploy
export const janusServers = [
	...(
		(process.env.NODE_ENV === 'production')
			? [
				process.env.JANUS_URL_WSS,
				process.env.JANUS_URL_HTTPS,
			]
			: [
				process.env.JANUS_URL_WS,
				process.env.JANUS_URL_HTTP,
			]
	)
];
// TODO: make configurable
export const janusRoomId = 1234;
