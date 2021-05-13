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
import { attachAudioBridgePlugin, initJanus } from './audio';
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


function appendToLog(type: string, obj: Record<string, unknown>) {
	const ts = Date.now();
	const s = JSON.stringify(obj);
	const entry = `${ts}: ${type}: ${s}`;
	log.update((prev) => [entry, ...prev]);
}


async function main() {
	console.log(Janus);

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

			setActiveModule: (moduleType: string) => {
				console.log(moduleType);
				socket.emit(
					messageTypes.SET_ACTIVE_MODULE,
					{
						authToken: get(authToken),
						payload: { activeModule: moduleType }
					}
				);
			},

			setWikiUrl: (wikipediaUrl: string) => {
				socket.emit(
					messageTypes.SET_WIKIPEDIA_URL,
					{
						authToken: get(authToken),
						payload: { url: wikipediaUrl }
					}
				);
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

		socket.on(messageTypes.ROOM_UPDATE, (msg) => {
			appendToLog(messageTypes.ROOM_UPDATE, msg);
		});

		socket.on(messageTypes.REVEAL_STATE_CHANGED, ({ state }) => {
			appendToLog(messageTypes.REVEAL_STATE_CHANGED, state);

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

	const janus = await initJanus();
	let myid: string;
	let webrtcUp: boolean;

	function joinHandler(msg: any) {
		// Successfully joined, negotiate WebRTC now
		if (msg['id']) {
			myid = msg['id'];
			console.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid);
			if (!webrtcUp) {
				webrtcUp = true;
				// Publish our stream
				audioBridge.createOffer({
					media: { video: false }, // This is an audio only room
					success: (jsep: any) => {
						console.log('Got SDP!', jsep);
						const publish = { request: 'configure', muted: false };
						audioBridge.send({ message: publish, jsep: jsep });
					},
					error: (error: any) => {
						console.error('WebRTC error:', error);
					}
				});
			}
		}
		// Any room participant?
		if (msg['participants']) {
			const list = msg['participants'];
			console.log('Got a list of participants:', list);
			for (const f in list) {
				const id = list[f]['id'];
				const display = list[f]['display'];
				const setup = list[f]['setup'];
				const muted = list[f]['muted'];
				console.log('  >> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
			}
		}
	};

	function roomChangedHandler(myid: string, msg: any) {
		myid = msg['id'];
		console.log('Moved to room ' + msg['room'] + ', new ID: ' + myid);
		// Any room participant?
		if (msg['participants']) {
			const list = msg['participants'];
			console.log('Got a list of participants:', list);
			for (const f in list) {
				const id = list[f]['id'];
				const display = list[f]['display'];
				const setup = list[f]['setup'];
				const muted = list[f]['muted'];
				console.log('  >> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
			}
		}
		return myid;
	}

	function eventHandler(msg: any) {
		if (msg['participants']) {
			const list = msg['participants'];
			console.log('Got a list of participants:', list);
			for (const f in list) {
				const id = list[f]['id'];
				const display = list[f]['display'];
				const setup = list[f]['setup'];
				const muted = list[f]['muted'];
				console.log('  >> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
			}
		} else if (msg['error']) {
			if (msg['error_code'] === 485) {
				// This is a 'no such room' error: give a more meaningful description
			} else {
				console.error(msg['error']);
			}
			return;
		}
		// Any new feed to attach to?
		if (msg['leaving']) {
			// One of the participants has gone away?
			const leaving = msg['leaving'];
			console.log('Participant left: ' + leaving);
		}
	}

	const callbacks = {
		onmessage: (msg, jsep) => {
			// We got a message/event (msg) from the plugin
			// If jsep is not null, this involves a WebRTC negotiation

			console.log(' ::: Got a message :::', msg);
			const event = msg['audiobridge'];
			console.log('Event: ' + event);

			if (event) {
				if (event === 'joined') {
					joinHandler(msg);
				} else if (event === 'roomchanged') {
					// The user switched to a different room
					myid = roomChangedHandler(myid, msg);
				} else if (event === 'destroyed') {
					// The room has been destroyed
					console.warn('The room has been destroyed!');
				} else if (event === 'event') {
					eventHandler(msg);
				}
			}

			if (jsep) {
				console.log('Handling SDP as well...', jsep);
				audioBridge.handleRemoteJsep({ jsep: jsep });
			}
		},
	};
	const audioBridge = await attachAudioBridgePlugin(janus, callbacks);

	const startAudio = () => {
		const register = {
			request: 'join',
			room: 1234, // TODO: make configurable,
			display: get(userId), // TODO: get actual user name
		};
		audioBridge.send({ message: register});
	};

	const stopAudio = () => {
		// TODO: implement
	};
}


main();
export {};
