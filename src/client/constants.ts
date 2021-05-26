const serverName = process.env.SERVER_NAME;
const serverPort = (process.env.NODE_ENV === 'production')
	? process.env.SERVER_PORT_HTTPS
	: process.env.SERVER_PORT;
const protocol = (process.env.NODE_ENV === 'production')
	? 'https'
	: 'http';
export const serverUrl = `${protocol}://${serverName}:${serverPort}`;
