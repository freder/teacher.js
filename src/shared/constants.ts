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
