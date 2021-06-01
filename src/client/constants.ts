const serverName = process.env.SERVER_NAME;
const serverPort = (process.env.NODE_ENV === 'production')
	? process.env.SERVER_PORT_HTTPS
	: process.env.SERVER_PORT;
const protocol = (process.env.NODE_ENV === 'production')
	? 'https'
	: 'http';
export const serverUrl = `${protocol}://${serverName}:${serverPort}`;

export const kastaliaUrl = 'https://kastalia.medienhaus.udk-berlin.de';

export const presentationIframeId = 'presentation-iframe';
