import { io, Socket } from 'socket.io-client';
import { writable, get } from 'svelte/store';

import { Message, RevealStateChangePayload } from '../shared/types';
import { messageTypes } from '../shared/constants';

require('./styles.css');
import App from './components/App.svelte';


const serverPort = process.env.SERVER_PORT;
const serverName = process.env.SERVER_NAME;
const serverUrl = `${serverName}:${serverPort}`;

console.log('environment:', process.env.NODE_ENV);
console.log('server url:', serverUrl);

let socket: Socket;
const authToken = writable(null);

// elements
const appContainer = document.querySelector('#App') as HTMLElement;
const logElem = document.querySelector('#log') as HTMLElement;


function main() {
	/* const app = */ new App({
		target: appContainer,
		props: {
			authToken,
			claimAdmin: () => {
				const secret = prompt('enter password');
				if (!secret) { return; }
				socket.emit(messageTypes.CLAIM_ADMIN_ROLE, { secret });
			}
		}
	});

	socket = io(serverUrl);
	socket.on('connect', () => {
		socket.on(messageTypes.ADMIN_TOKEN, ({ token }) => {
			if (!token) {
				return alert('denied');
			}
			authToken.set(token);
		});

		// iframe messages
		window.addEventListener('message', (msg) => {
			const { /* origin, */ data } = msg;
			if (data.type === messageTypes.REVEAL_STATE_CHANGED) {
				if (!get(authToken)) { return; }
				const payload: RevealStateChangePayload = {
					state: data.state,
				};
				const msg: Message = {
					authToken: get(authToken),
					payload
				};
				socket.emit(messageTypes.REVEAL_STATE_CHANGED, msg);
			}
		});

		socket.on(messageTypes.REVEAL_STATE_CHANGED, ({ state }) => {
			const ts = Date.now();
			const type = messageTypes.REVEAL_STATE_CHANGED;
			const s = JSON.stringify(state);
			const elem = document.createElement('div');
			elem.textContent = `${ts}: ${type}: ${s}`;
			logElem.prepend(elem);

			// inform iframe
			const data = {
				type: messageTypes.REVEAL_STATE_CHANGED,
				state,
			};
			const iframe = document.querySelector('iframe#presentation') as HTMLIFrameElement;
			iframe.contentWindow.postMessage(data, '*');
		});
	});
}


main();
export {};
