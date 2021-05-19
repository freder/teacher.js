import * as R from 'ramda';
import { io, Socket } from 'socket.io-client';
import { writable, get } from 'svelte/store';
import UAParser from 'ua-parser-js';

import type {
	Message,
	PresentationStartPayload,
	RevealStateChangePayload,
	RoomState,
} from '../shared/types';
import { janusRoomId, messageTypes } from '../shared/constants';

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
const userState = writable({
	userId: undefined,
	name: 'anonymous',
	authToken: undefined,
});
const uiState = writable({
	log: [],
});
const audioState = writable({
	audioStarted: false,
	muted: false,
});


function appendToLog(type: string, obj: Record<string, unknown>) {
	const ts = Date.now();
	const s = JSON.stringify(obj);
	const entry = `${ts}: ${type}: ${s}`;
	uiState.update((prev) => ({
		...prev,
		log: [entry, ...prev.log]
	}));
}


function setUserName(name: string) {
	userState.update((prev) => ({ ...prev, name }));
	serverUpdateUser();
}


function serverUpdateUser() {
	socket.emit(
		messageTypes.USER_INFO,
		R.omit(['authToken', 'userId'], get(userState))
	);
}


function claimAdmin() {
	const secret = prompt('enter password');
	if (!secret) { return; }
	socket.emit(messageTypes.CLAIM_ADMIN_ROLE, { secret });
}


async function main() {
	/* const app = */ new App({
		target: document.querySelector('#App'),
		props: {
			userState,
			roomState,
			uiState,
			audioState,
			claimAdmin,

			setActiveModule: (moduleType: string) => {
				socket.emit(
					messageTypes.SET_ACTIVE_MODULE,
					{
						authToken: get(userState).authToken,
						payload: { activeModule: moduleType }
					}
				);
			},

			setWikiUrl: (wikipediaUrl: string) => {
				socket.emit(
					messageTypes.SET_WIKIPEDIA_URL,
					{
						authToken: get(userState).authToken,
						payload: { url: wikipediaUrl }
					}
				);
			},

			startPres: (kastaliaId: string) => {
				const payload: PresentationStartPayload = {
					url: `https://kastalia.medienhaus.udk-berlin.de/${kastaliaId}`
				};
				socket.emit(
					messageTypes.START_PRESENTATION,
					{
						authToken: get(userState).authToken,
						payload,
					}
				);
			},

			stopPres: () => {
				socket.emit(
					messageTypes.END_PRESENTATION,
					{ authToken: get(userState).authToken }
				);
			},

			onPresentationLoaded: () => {
				socket.emit(messageTypes.BRING_ME_UP_TO_SPEED);
			},

			startAudio: () => startAudio(),
			stopAudio: () => stopAudio(),
			toggleMute: () => toggleMute(),

			setUserName,
		}
	});

	let options = {
		secure: true,
		reconnect: true,
		rejectUnauthorized: false
	};
	if (process.env.NODE_ENV === 'development') {
		options = undefined;
	}
	socket = io(serverUrl, options);
	socket.on('connect', () => {
		userState.update((prev) => ({ ...prev, userId: socket.id }));

		const ua = new UAParser();
		const [os, br] = [ua.getOS(), ua.getBrowser()];
		const name = `${os.name}, ${br.name} ${br.major}`;
		setUserName(name);

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
			userState.update((prev) => ({ ...prev, authToken: token }));
		});

		// iframe messages
		window.addEventListener('message', (msg) => {
			const { /* origin, */ data } = msg;
			if (data.type === messageTypes.REVEAL_STATE_CHANGED) {
				if (!get(userState).authToken) { return; }
				const payload: RevealStateChangePayload = {
					state: data.state,
				};
				const msg: Message = {
					authToken: get(userState).authToken,
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
			const { adminIds } = get(roomState);
			const { userId } = get(userState);
			if (adminIds.includes(userId)) {
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

	// -------- audio --------
	let janus: any;
	let audioBridge: any;
	let myid: string;
	let webrtcUp: boolean;

	function joinHandler(msg: any) {
		// Successfully joined, negotiate WebRTC now
		if (msg['id']) {
			myid = msg['id'];
			console.info('Successfully joined room ' + msg['room'] + ' with ID ' + myid);
			if (!webrtcUp) {
				webrtcUp = true;
				// Publish our stream
				audioBridge.createOffer({
					iceRestart: true,
					media: { video: false }, // This is an audio only room
					success: (jsep: any) => {
						console.info('Got SDP!', jsep);
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
			// const list = msg['participants'];
			// console.info('Got a list of participants:', list);
			// for (const f in list) {
			// 	const id = list[f]['id'];
			// 	const display = list[f]['display'];
			// 	const setup = list[f]['setup'];
			// 	const muted = list[f]['muted'];
			// 	console.info('  >> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
			// }
		}
	}

	function roomChangedHandler(myid: string, msg: any) {
		myid = msg['id'];
		console.info('Moved to room ' + msg['room'] + ', new ID: ' + myid);
		// Any room participant?
		if (msg['participants']) {
			// const list = msg['participants'];
			// console.info('Got a list of participants:', list);
			// for (const f in list) {
			// 	const id = list[f]['id'];
			// 	const display = list[f]['display'];
			// 	const setup = list[f]['setup'];
			// 	const muted = list[f]['muted'];
			// 	console.info('  >> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
			// }
		}
		return myid;
	}

	function eventHandler(msg: any) {
		if (msg['participants']) {
			// const list = msg['participants'];
			// console.info('Got a list of participants:', list);
			// for (const f in list) {
			// 	const id = list[f]['id'];
			// 	const display = list[f]['display'];
			// 	const setup = list[f]['setup'];
			// 	const muted = list[f]['muted'];
			// 	console.info('  >> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
			// }
		} else if (msg['error']) {
			if (msg['error_code'] === 485) {
				// 'no such room' error
			} else {
				console.error(msg['error']);
			}
			return;
		}

		// Any new feed to attach to?
		if (msg['leaving']) {
			// One of the participants has gone away?
			const leaving = msg['leaving'];
			console.info('Participant left: ' + leaving);
		}
	}

	function toggleMute() {
		const m = !get(audioState).muted;
		audioState.update((prev) => ({ ...prev, muted: m }));
		audioBridge.send({
			message: {
				request: 'configure',
				muted: m
			}
		});
	}

	const callbacks = {
		onmessage: (msg: any, jsep: any) => {
			// We got a message/event (msg) from the plugin
			// If jsep is not null, this involves a WebRTC negotiation

			console.info(' ::: Got a message :::', msg);
			const event = msg['audiobridge'];
			console.info('Event: ' + event);

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
				console.info('Handling SDP as well...', jsep);
				audioBridge.handleRemoteJsep({ jsep: jsep });
			}
		},

		oncleanup: () => {
			webrtcUp = false;
			console.info(' ::: Got a cleanup notification :::');
		}
	};

	const startAudio = async () => {
		if (!janus) {
			janus = await initJanus();
		}
		audioBridge = await attachAudioBridgePlugin(janus, callbacks);

		const register = {
			request: 'join',
			room: janusRoomId,
			display: get(userState).name,
		};
		audioBridge.send({ message: register});
		audioState.update((prev) => ({ ...prev, audioStarted: true }));
	};

	const stopAudio = () => {
		janus.destroy();
		janus = null;
		myid = null;
		webrtcUp = false;
		audioBridge = null;
		audioState.update((prev) => ({
			...prev,
			audioStarted: false,
			muted: false,
		}));
	};
}


main();
export {};
