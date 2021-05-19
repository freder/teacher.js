// TODO: make this configurable
const serverPort = (process.env.NODE_ENV === 'production')
	? 777
	: process.env.SERVER_PORT;
const serverName = process.env.SERVER_NAME;
const protocol = (process.env.NODE_ENV === 'production')
	? 'https'
	: 'http';
export const serverUrl = `${protocol}://${serverName}:${serverPort}`;
