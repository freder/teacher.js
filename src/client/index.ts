import { io, Socket } from 'socket.io-client';
import { writable, get } from 'svelte/store';
import UAParser from 'ua-parser-js';

import type {
	Message,
	RevealStateChangePayload,
	RoomState,
} from '../shared/types';
import { messageTypes } from '../shared/constants';

import { serverUrl } from './constants';
import App from './components/App.svelte';
require('./styles.css');


console.log('environment:', process.env.NODE_ENV);
console.log('server url:', serverUrl);

let socket: Socket;

const initialRoomState: RoomState = {
	adminIds: [],
	users: [],
};
const roomState = writable(initialRoomState);
const userId = writable(undefined);
const authToken = writable(null);
const log = writable([]);


function main() {
	const claimAdmin = () => {
		const secret = prompt('enter password');
		if (!secret) { return; }
		socket.emit(messageTypes.CLAIM_ADMIN_ROLE, { secret });
	};

	/* const app = */ new App({
		target: document.querySelector('#App'),
		props: {
			userId,
			roomState,
			log,
			claimAdmin,

			startWiki: (wikipediaUrl: string) => {
				console.log(wikipediaUrl);
				// socket.emit(
				// 	messageTypes.START_WIKIPEDIA,
				// 	{
				// 		authToken: get(authToken),
				// 		payload: {
				// 			url: wikipediaUrl
				// 		}
				// 	}
				// );
			},

			startPres: (kastaliaId: string) => {
				socket.emit(
					messageTypes.START_PRESENTATION,
					{
						authToken: get(authToken),
						payload: {
							url: `https://kastalia.medienhaus.udk-berlin.de/${kastaliaId}`
						}
					}
				);
			},

			stopPres: () => {
				socket.emit(
					messageTypes.END_PRESENTATION,
					{ authToken: get(authToken) }
				);
			},

			onPresentationLoaded: () => {
				socket.emit(messageTypes.BRING_ME_UP_TO_SPEED);
			}
		}
	});

	const ua = new UAParser();
	const [os, br] = [ua.getOS(), ua.getBrowser()];
	const name = `${os.name}, ${br.name} ${br.major}`;

	socket = io(serverUrl);
	socket.on('connect', () => {
		userId.set(socket.id);

		socket.emit(messageTypes.USER_INFO, { name });

		// in case we're connecting late: request a full state.
		// server will emit all the necessary messages, such as
		// ROOM_UPDATE, REVEAL_STATE_CHANGED
		socket.emit(messageTypes.BRING_ME_UP_TO_SPEED);

		socket.on(messageTypes.ROOM_UPDATE, (rs) => {
			roomState.set(rs);
		});

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
			const entry = `${ts}: ${type}: ${s}`;
			log.update((prev) => [entry, ...prev]);

			// if we're the one who originally caused the event, we will
			// acknowledge it (see above), but not react to it.
			if (get(roomState).adminIds.includes(get(userId))) {
				// TODO: find a nicer way for this ↑
				return;
			}

			// inform iframe
			const data = {
				type: messageTypes.REVEAL_STATE_CHANGED,
				state,
			};
			const iframe = document.querySelector('iframe#presentation') as HTMLIFrameElement;
			if (iframe) {
				iframe.contentWindow.postMessage(data, '*');
			}
		});
	});
}


main();
export {};
