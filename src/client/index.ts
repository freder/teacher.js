import { io, Socket } from 'socket.io-client';

import { Message, RevealStateChangePayload } from '../shared/types';
import { messageTypes } from '../shared/constants';

require('./styles.css');


const serverPort = process.env.SERVER_PORT;
const serverName = process.env.SERVER_NAME;
const serverUrl = `${serverName}:${serverPort}`;

console.log('environment:', process.env.NODE_ENV);
console.log('server url:', serverUrl);

let socket: Socket;
let authToken: string;

// elements
const roleElem = document.querySelector('#role') as HTMLElement;
const logElem = document.querySelector('#log') as HTMLElement;
const claimAdminButton = document.querySelector('button#claim-admin') as HTMLElement;


function main() {
	socket = io(serverUrl);

	socket.on('connect', () => {
		claimAdminButton.onclick = () => {
			const secret = prompt('enter password');
			if (!secret) { return; }
			socket.emit(messageTypes.CLAIM_ADMIN_ROLE, { secret });
		};

		socket.on(messageTypes.ADMIN_TOKEN, ({ token }) => {
			if (!token) {
				alert('denied');
				return;
			}
			authToken = token;
			document.body.style.background = 'lightgray';
			roleElem.textContent = 'admin';
		});

		// iframe messages
		window.addEventListener('message', ({ /* origin, */ data }) => {
			if (data.type === messageTypes.REVEAL_STATE_CHANGED) {
				if (!authToken) { return; }
				const payload: RevealStateChangePayload = {
					state: data.state,
				};
				const msg: Message = { authToken, payload };
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
