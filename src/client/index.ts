import { io, Socket } from 'socket.io-client';
import html from 'nanohtml/lib/browser';

require('./styles.css');


// TODO: increase security
// check if admin flag is set
const isAdmin = window.location.hash === '#admin';

// elements
const roleElem = document.querySelector('#role');
const logContainerElem = document.querySelector('#log-container') as HTMLElement;
const logElem = document.querySelector('#log') as HTMLElement;
const adminControlsElem = document.querySelector('#admin-controls') as HTMLElement;


function initAdminControls(socket: Socket) {
	document.querySelector('#admin-controls button.left')
		.addEventListener('click', () => socket.emit('slides', 'left'));
	document.querySelector('#admin-controls button.right')
		.addEventListener('click', () => socket.emit('slides', 'right'));
	document.querySelector('#admin-controls button.up')
		.addEventListener('click', () => socket.emit('slides', 'up'));
	document.querySelector('#admin-controls button.down')
		.addEventListener('click', () => socket.emit('slides', 'down'));
}


function main() {
	// TODO: use config file, or .env
	const socket = io('http://localhost:3000');

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
			socket.on('slides', (cmd) => {
				const elem = html`<div>${Date.now()}: ${cmd}</div>`;
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
