import debug from 'debug';

import { debugPrefix } from './constants';


export const logSlideCmd = debug(`${debugPrefix}:cmd:slides`);
export const logNetEvent = debug(`${debugPrefix}:net`);
export const logInfo = debug(`${debugPrefix}:info`);
// export const logAuth = debug(`${debugPrefix}:auth`);
