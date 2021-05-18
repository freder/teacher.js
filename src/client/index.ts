import * as R from 'ramda';
import { io, Socket } from 'socket.io-client';
import { writable, get } from 'svelte/store';
import UAParser from 'ua-parser-js';

import type {
	ActiveModulePayload,
	AuthTokenPayload,
	ClaimAdminRolePayload,
	EmptyPayload,
	Message,
	PresentationStartPayload,
	PresentationState,
	RevealStateChangePayload,
	RoomState,
	UserInfo,
	WikipediaUrlPayload,
} from '../shared/types';
import { janusRoomId, messageTypes } from '../shared/constants';

import { serverUrl } from './constants';
import { attachAudioBridgePlugin, initJanus } from './audio';
import type {
	JanusInstance,
	AudioBridgeInstance,
	JanusMessage
} from './audio';
import App from './components/App.svelte';
require('./styles.css');


// force https when using the respective port
if (
	(location.port === process.env.SERVER_PORT_HTTPS) &&
	(location.protocol !== 'https')
) {
	location.replace(
		location.href.replace(/^http:/i, 'https')
	);
}


console.log('environment:', process.env.NODE_ENV);
console.log('server url:', serverUrl);

let socket: Socket;

const initialRoomState: RoomState = {
	adminIds: [],
	users: [],
};
const roomState = writable(initialRoomState);
const userState = writable({
	socketId: undefined,
	name: 'anonymous',
	authToken: undefined,
});
const uiState = writable({
	log: [],
});
const audioState = writable({
	audioStarted: false, // TODO: needed?
	connected: false,
	muted: false,
	janusParticipantId: undefined,
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


function makeNameFromBrowser(): string {
	const ua = new UAParser();
	const [os, br] = [ua.getOS(), ua.getBrowser()];
	return `${os.name}, ${br.name} ${br.major}`;
}


function setUserName(name: string) {
	userState.update((prev) => ({ ...prev, name }));
	serverUpdateUser();

	// TODO: also rename user in janus room
	// audioBridge.send({
	// 	message: {
	// 		request: 'configure',
	// 		display: name
	// 	}
	// });
}


function serverUpdateUser() {
	const us = get(userState);
	const as = get(audioState);
	const msg: Message<UserInfo> = {
		payload: {
			name: us.name,
			socketId: us.socketId,
			connected: as.connected,
			muted: as.muted,
		}
	};
	socket.emit(
		messageTypes.USER_INFO,
		msg
	);
}


function claimAdmin() {
	const secret = prompt('enter password');
	if (!secret) { return; }
	const msg: Message<ClaimAdminRolePayload> = {
		payload: { secret }
	};
	socket.emit(
		messageTypes.CLAIM_ADMIN_ROLE,
		msg
	);
}


function logParticipants(participants: Array<Record<string, unknown>>) {
	console.info('Got a list of participants:', participants);
	for (const f in participants) {
		const { id, display, setup, muted } = participants[f];
		console.info('>> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
	}
}


async function main() {
	const setWikiUrl = (wikipediaUrl: string) => {
		const msg: Message<WikipediaUrlPayload> = {
			authToken: get(userState).authToken,
			payload: { url: wikipediaUrl }
		};
		socket.emit(messageTypes.SET_WIKIPEDIA_URL, msg);
	};

	// const setWikiUrl = (wikipediaUrl: string) => {
	// 	// https://en.wikipedia.org/wiki/Documentary_Now!#Episodes
	// 	const encodedUrl = encodeURIComponent(wikipediaUrl);
	// 	console.log(encodedUrl);
	// 	const url = `${serverUrl}/proxy/wikipedia/${encodedUrl}`;
	// 	socket.emit(
	// 		messageTypes.SET_WIKIPEDIA_URL,
	// 		{
	// 			authToken: get(authToken),
	// 			payload: { url }
	// 		}
	// 	);
	// };

	/* const app = */ new App({
		target: document.querySelector('#App'),
		props: {
			userState,
			roomState,
			uiState,
			audioState,
			claimAdmin,

			setActiveModule: (moduleName: string) => {
				const msg: Message<ActiveModulePayload> = {
					authToken: get(userState).authToken,
					payload: { activeModule: moduleName }
				};
				socket.emit(messageTypes.SET_ACTIVE_MODULE, msg);
			},
			setWikiUrl,

			startPres: (kastaliaId: string) => {
				const payload: PresentationStartPayload = {
					// TODO: make this configurable
					url: `https://kastalia.medienhaus.udk-berlin.de/${kastaliaId}`
				};
				const msg: Message<PresentationStartPayload> = {
					authToken: get(userState).authToken,
					payload,
				};
				socket.emit(messageTypes.START_PRESENTATION, msg);
			},

			stopPres: () => {
				const msg: Message<EmptyPayload> = {
					authToken: get(userState).authToken,
					payload: {}
				};
				socket.emit(messageTypes.END_PRESENTATION, msg);
			},

			onPresentationLoaded: () => {
				const msg: Message<EmptyPayload> = {
					payload: {}
				};
				socket.emit(messageTypes.BRING_ME_UP_TO_SPEED, msg);
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
		userState.update((prev) => ({ ...prev, socketId: socket.id }));

		setUserName(makeNameFromBrowser());

		// in case we're connecting late: request a full state.
		// server will emit all the necessary messages
		const msg: Message<EmptyPayload> = {
			payload: {}
		};
		socket.emit(
			messageTypes.BRING_ME_UP_TO_SPEED,
			msg
		);

		socket.on(messageTypes.ROOM_UPDATE, (msg: Message<RoomState>) => {
			const rs = msg.payload;
			// if (get(authToken)) {
			// 	if (get(roomState).wikipediaUrl !== rs.wikipediaUrl) {
			// 		return;
			// 	}
			// }
			roomState.set(rs);
			appendToLog(messageTypes.ROOM_UPDATE, rs);
		});

		socket.on(messageTypes.ADMIN_TOKEN, (msg: Message<AuthTokenPayload>) => {
			const { token } = msg.payload;
			if (!token) {
				return alert('denied');
			}
			userState.update((prev) => ({ ...prev, authToken: token }));
		});

		// iframe messages
		window.addEventListener('message', (msg) => {
			const { /* origin, */ data } = msg;

			if (data.type === messageTypes.REVEAL_STATE_CHANGED) {
				const { authToken } = get(userState);
				if (!authToken) { return; }
				const msg: Message<RevealStateChangePayload> = {
					authToken,
					payload: { state: data.state }
				};
				socket.emit(messageTypes.REVEAL_STATE_CHANGED, msg);
			} else if (data.type === 'WIKIPEDIA_SECTION_CHANGED') {
				console.log(data);
				// if (get(authToken)) {
				// 	const current = get(roomState).wikipediaUrl;
				// 	const encodedWikiUrl = R.last(current.split('/'));
				// 	const url = new URL(
				// 		decodeURIComponent(encodedWikiUrl)
				// 	);
				// 	url.hash = data.hash;
				// 	setWikiUrl(url.toString());
				// }
			}
		});

		socket.on(messageTypes.REVEAL_STATE_CHANGED, (msg: Message<PresentationState>) => {
			const { state } = msg.payload;
			appendToLog(messageTypes.REVEAL_STATE_CHANGED, state);

			// if we're the one who originally caused the event, we will
			// acknowledge it (see above), but not react to it.
			const { adminIds } = get(roomState);
			const { socketId } = get(userState);
			if (adminIds.includes(socketId)) {
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
	let janus: JanusInstance;
	let audioBridge: AudioBridgeInstance;

	function joinHandler(msg: JanusMessage) {
		// Successfully joined, negotiate WebRTC now
		if (msg.id) {
			console.info('Successfully joined room ' + msg.room + ' with ID ' + msg.id);
			audioState.update((prev) => ({ ...prev, janusParticipantId: msg.id }));
			serverUpdateUser();
			if (!get(audioState).connected) {
				audioState.update((prev) => ({ ...prev, connected: true }));
				// Publish our stream
				audioBridge.createOffer({
					iceRestart: true,
					media: { video: false }, // This is an audio only room
					success: (jsep: any) => {
						// console.info('Got SDP!', jsep);
						const publish = { request: 'configure', muted: false };
						audioBridge.send({ message: publish, jsep: jsep });
					},
					error: (error: any) => {
						console.error('WebRTC error:', error);
					}
				});
			}
		}

		if (msg.participants) {
			logParticipants(msg.participants);
		}
	}

	function roomChangedHandler(msg: JanusMessage) {
		console.info('Moved to room ' + msg.room + ', new ID: ' + msg.id);
		if (msg.participants) {
			logParticipants(msg.participants);
		}
		return msg.id;
	}

	function eventHandler(msg: JanusMessage) {
		if (msg.participants) {
			logParticipants(msg.participants);
		} else if (msg.error) {
			if (msg.error_code === 485) {
				// 'no such room' error
			} else {
				console.error(msg.error);
			}
			return;
		}

		// One of the participants has gone away?
		if (msg.leaving) {
			const leaving = msg.leaving;
			console.info('Participant left: ' + leaving);
		}
	}

	function toggleMute() {
		const m = !get(audioState).muted;
		audioBridge.send({
			message: {
				request: 'configure',
				muted: m
			}
		});
		audioState.update((prev) => ({ ...prev, muted: m }));
		serverUpdateUser();
	}

	const callbacks = {
		onmessage: (msg: JanusMessage, jsep: any) => {
			// a message/event has been received from the plugin;
			console.info(' ::: Got a message :::', msg);
			const event = msg.audiobridge;
			console.info('Event: ' + event);

			if (event) {
				if (event === 'joined') {
					joinHandler(msg);
				} else if (event === 'roomchanged') {
					// The user switched to a different room
					const newId = roomChangedHandler(msg);
					audioState.update((prev) => ({ ...prev, janusParticipantId: newId }));
					serverUpdateUser();
				} else if (event === 'destroyed') {
					// The room has been destroyed
					console.warn('The room has been destroyed!');
				} else if (event === 'event') {
					eventHandler(msg);
				}
			}

			// If jsep is not null, this involves a WebRTC negotiation
			if (jsep) {
				// console.info('Handling SDP as well...', jsep);
				audioBridge.handleRemoteJsep({ jsep: jsep });
			}
		},

		webrtcState: (on: boolean) => {
			// this callback is triggered with a true value when the PeerConnection associated to a handle becomes active (so ICE, DTLS and everything else succeeded) from the Janus perspective, while false is triggered when the PeerConnection goes down instead; useful to figure out when WebRTC is actually up and running between you and Janus (e.g., to notify a user they're actually now active in a conference); notice that in case of false a reason string may be present as an optional parameter
			console.log(
				'Janus says our WebRTC PeerConnection is ' +
				(on ? 'up' : 'down') + ' now'
			);
			audioState.update((prev) => ({ ...prev, connected: on }));
			serverUpdateUser();
		},

		oncleanup: () => {
			// the WebRTC PeerConnection with the plugin was closed
			// The plugin handle is still valid so we can create a new one

			audioState.update((prev) => ({ ...prev, connected: false }));
			serverUpdateUser();
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
		// serverUpdateUser();
	};

	const stopAudio = () => {
		janus.destroy();
		janus = null;
		audioBridge = null;
		audioState.update((prev) => ({
			...prev,
			audioStarted: false,
			connected: false,
			muted: false,
			janusParticipantId: null,
		}));
		serverUpdateUser();
	};
}


main();
export {};
