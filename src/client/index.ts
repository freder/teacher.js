import { io, Socket } from 'socket.io-client';
import html from 'nanohtml/lib/browser';

import { SlideEventData } from '../shared/types';
import { messageTypes } from '../shared/constants';

require('./styles.css');


const serverPort = process.env.SERVER_PORT;
const serverUrl = `http://localhost:${serverPort}`;
console.log('environment:', process.env.NODE_ENV);
console.log('server url:', serverUrl);

// TODO: increase security
// check if admin flag is set
const isAdmin = window.location.hash === '#admin';

// elements
const roleElem = document.querySelector('#role') as HTMLElement;
const logContainerElem = document.querySelector('#log-container') as HTMLElement;
const logElem = document.querySelector('#log') as HTMLElement;
const adminControlsElem = document.querySelector('#admin-controls') as HTMLElement;


function initAdminControls(socket: Socket) {
	window.addEventListener('message', ({ /* origin, */ data }) => {
		if (data.type === 'slidechanged') {
			const msg: SlideEventData = {
				type: messageTypes.SLIDE_CHANGED,
				index: data.index,
			};
			socket.emit(messageTypes.SLIDE_EVENT, msg);
		}
	});
}


function main() {
	const socket = io(serverUrl);

	socket.on('connect', () => {
		if (isAdmin) {
			socket.emit('request-role:admin');
			socket.on('grant-role:admin', () => {
				document.body.style.background = 'gold';
				roleElem.textContent = 'admin';
				adminControlsElem.style.display = 'unset';
				initAdminControls(socket);
			});
		} else {
			logContainerElem.style.display = 'unset';
			socket.on(messageTypes.SLIDE_CHANGED, (index: [number, number]) => {
				const timestamp = Date.now();
				const type = messageTypes.SLIDE_CHANGED;
				const idx = JSON.stringify(index);
				const elem = html`<div>${timestamp}: ${type}: ${idx}</div>`;
				logElem.prepend(elem);
			});
		}
	});

	socket.on('disconnect', () => {
		//
	});

	// socket.on('hello', (msg) => {
	// 	console.log(msg);
	// });
}


main();
export {};
