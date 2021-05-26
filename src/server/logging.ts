import fs from 'fs';

import debug from 'debug';

import { getISOTimestamp } from '../client/utils';
import { messageTypes } from '../shared/constants';
import { debugPrefix, logFilePath } from './constants';


// the types of events we want in the log file
const whitelist = [
	messageTypes.SET_ACTIVE_MODULE,
	messageTypes.REVEAL_STATE_CHANGED,
	messageTypes.START_PRESENTATION,
	messageTypes.END_PRESENTATION,
	messageTypes.SET_WIKIPEDIA_URL,
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


export const logPresentationEvent = wrap(debug(`${debugPrefix}:presentation`));
export const logWikipediaEvent = wrap(debug(`${debugPrefix}:wiki`));
export const logConnectionEvent = wrap(debug(`${debugPrefix}:net`));
export const logModuleEvent = wrap(debug(`${debugPrefix}:module`));
export const logInfo = wrap(debug(`${debugPrefix}:info`));
