import path from 'path';


export const debugPrefix = 'T.S';
export const logFilePath = path.join(__dirname, '../../log.txt');

export const actionTypes = {
	CLIENT_CONNECTED: 'CLIENT_CONNECTED',
	CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
	UPDATE_ADMINS: 'UPDATE_ADMINS',
};

export const logIndent = '    ';
