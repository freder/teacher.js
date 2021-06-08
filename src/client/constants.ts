const serverName = process.env.SERVER_NAME;
const serverPort = (process.env.NODE_ENV === 'production')
	? process.env.SERVER_PORT_HTTPS
	: process.env.SERVER_PORT;
const protocol = (process.env.NODE_ENV === 'production')
	? 'https'
	: 'http';
export const serverUrl = `${protocol}://${serverName}:${serverPort}`;

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

export const kastaliaBaseUrl = 'https://kastalia.medienhaus.udk-berlin.de';
export const wikipediaBaseUrl = 'https://en.wikipedia.org';

export const hydrogenBaseUrl = process.env.HYDROGEN_URL;
export const matrixRoomId = '!MnnWYJyaHwOLoMoWZV:m3x.baumhaus.digital';

export const presentationIframeId = 'presentation-iframe';
