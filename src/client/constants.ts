const {
	NODE_ENV,
	SERVER_NAME,
	SERVER_PORT,
	SERVER_PORT_HTTPS,
} = process.env;

const serverName = SERVER_NAME;
// TODO: make this configurable
const serverPort = (NODE_ENV === 'production')
	? SERVER_PORT_HTTPS
	: SERVER_PORT;
const protocol = (NODE_ENV === 'production')
	? 'https'
	: 'http';
export const serverUrl = `${protocol}://${serverName}:${serverPort}`;
