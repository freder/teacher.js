import { io, Socket } from 'socket.io-client';

import { SlideEventData } from '../shared/types';
import { messageTypes } from '../shared/constants';

require('./styles.css');


const serverPort = process.env.SERVER_PORT;
const serverUrl = `http://localhost:${serverPort}`;
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
			document.body.style.background = 'gold';
			roleElem.textContent = 'admin';
		});

		window.addEventListener('message', ({ /* origin, */ data }) => {
			// TODO: rename to 'slide-state-change'
			if (data.type === 'slidechanged') {
				if (!authToken) { return; }
				const payload: SlideEventData = {
					authToken,
					type: messageTypes.SLIDE_CHANGED,
					index: data.index,
				};
				socket.emit(messageTypes.SLIDE_EVENT, payload);
			}
		});

		socket.on(messageTypes.SLIDE_CHANGED, (index: [number, number]) => {
			const timestamp = Date.now();
			const type = messageTypes.SLIDE_CHANGED;
			const idx = JSON.stringify(index);
			const elem = document.createElement('div');
			elem.textContent = `${timestamp}: ${type}: ${idx}`;
			logElem.prepend(elem);
		});
	});
}


main();
export {};
