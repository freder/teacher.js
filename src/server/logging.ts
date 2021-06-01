import fs from 'fs';

import debug from 'debug';

import { getISOTimestamp } from '../client/utils';
import { messageTypes } from '../shared/constants';
import { debugPrefix as prfx, logFilePath } from './constants';


// the types of events we want in the log file
const whitelist = [
	messageTypes.SET_ACTIVE_MODULE,
	messageTypes.REVEAL_STATE_CHANGED,
	messageTypes.START_PRESENTATION,
	messageTypes.END_PRESENTATION,
	messageTypes.URL_CHANGED,
];


function wrap(debugLogFn: (...args: string[]) => void) {
	return (msgType: string, s: string) => {
		const entry = `${msgType} ${s}`;
		debugLogFn(entry);
		if (whitelist.includes(msgType)) {
			appendToLogFile(entry);
		}
	};
}


function appendToLogFile(entry: string) {
	// create file if it does not exists
	if (!fs.existsSync(logFilePath)) {
		fs.writeFileSync(logFilePath, '');
	}

	const ts = getISOTimestamp();
	fs.appendFileSync(logFilePath, `${ts} ${entry}\n`);
}


export const logPresentationEvent = wrap(debug(`${prfx}:presentation`));
export const logWikipediaEvent = wrap(debug(`${prfx}:wiki`));
export const logConnectionEvent = wrap(debug(`${prfx}:net`));
export const logModuleEvent = wrap(debug(`${prfx}:module`));
export const logRoomEvent = wrap(debug(`${prfx}:room`));

export const logBroadcast = wrap(debug(`${prfx}:broadcast`));

export const logInfo = debug(`${prfx}:info`);
export const logRedux = debug(`${prfx}:redux`);
