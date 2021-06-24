import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
if (process.env.NODE_ENV === 'production') {
	Sentry.init({
		dsn: 'https://90cef375d5004cbbab9560beee4750d1@o861816.ingest.sentry.io/5821578',
		integrations: [new Integrations.BrowserTracing()],
		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});
}

import * as R from 'ramda';
import { io, Socket } from 'socket.io-client';
import { writable, get } from 'svelte/store';
import UAParser from 'ua-parser-js';
import type {
	Janus,
	JSEP,
	PluginHandle,
	PluginMessage
} from 'janus-gateway';

import type {
	Message,
	ModuleState,
	RoomState,
	UrlPayload,
	UserInfo,
	ActiveModulePayload,
	AuthTokenPayload,
	ClaimAdminRolePayload,
	EmptyPayload,
	PresentationStartPayload,
	RevealStateChangePayload,
	RevealState,
	MatrixRoomPayload,
} from '../shared/types';
import {
	initialModuleState,
	initialRoomState,
	janusRoomId,
	messageTypes,
	moduleTypes,
	matrixRoomId,
	proxyPathWikipedia,
	wikipediaBaseUrl,
	proxyPathKastalia,
	kastaliaBaseUrl,
} from '../shared/constants';
import { getProxiedUrl, urlFromProxiedUrl } from '../shared/utils';

import {
	serverUrl,
	presentationIframeId,
} from './constants';
import { attachAudioBridgePlugin, initJanus } from './audio';
import App from './components/App.svelte';
require('./styles.css');


// force https when using the respective port
// if (
// 	(location.port === process.env.SERVER_PORT_HTTPS) &&
// 	(location.protocol !== 'https')
// ) {
// 	location.replace(
// 		location.href.replace(/^http:/i, 'https')
// 	);
// }


console.log('environment:', process.env.NODE_ENV);
console.log('server url:', serverUrl);

let socket: Socket;

const roomState = writable(initialRoomState);
const moduleState = writable({
	...initialModuleState,
	activeSectionHash: '',
});
const userState = writable({
	socketId: undefined,
	name: 'anonymous',
	authToken: undefined,
});
const audioState = writable({
	audioStarted: false, // TODO: needed?
	connected: false,
	muted: false,
	janusParticipantId: undefined,
});


function makeNameFromBrowser(): string {
	const ua = new UAParser();
	const [os, br] = [ua.getOS(), ua.getBrowser()];
	return `${os.name}, ${br.name} ${br.major}`;
}


function setUserName(name: string) {
	userState.update((prev) => ({ ...prev, name }));
	sendUserInfo();

	// TODO: also rename user in janus room
	// audioBridge.send({
	// 	message: {
	// 		request: 'configure',
	// 		display: name
	// 	}
	// });
}


function sendUserInfo() {
	const us = get(userState);
	const as = get(audioState);
	const msg: Message<UserInfo> = {
		payload: {
			...R.omit(['authToken'], us),
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


function setActiveModule(moduleName: string) {
	// TODO: find a better way to reset pieces of local state
	if (moduleName !== moduleTypes.WIKIPEDIA) {
		moduleState.update(
			(prev) => R.assocPath(
				['wikipediaState', 'activeSectionHash'], '', prev
			)
		);
	}

	const msg: Message<ActiveModulePayload> = {
		authToken: get(userState).authToken,
		payload: { activeModule: moduleName }
	};
	socket.emit(messageTypes.SET_ACTIVE_MODULE, msg);
}


function startPresentation(kastaliaId: string) {
	const proxiedUrl = `${serverUrl}/${proxyPathKastalia}/${kastaliaId}`;
	const payload: PresentationStartPayload = {
		url: proxiedUrl
	};
	const msg: Message<PresentationStartPayload> = {
		authToken: get(userState).authToken,
		payload,
	};
	socket.emit(messageTypes.START_PRESENTATION, msg);

	// send original url to chat
	const origUrl = `${kastaliaBaseUrl}/${kastaliaId}`;
	const { matrixRoomId } = get(moduleState).chatState;
	chatSendUrl(matrixRoomId, origUrl);
}


function stopPresentation() {
	const msg: Message<EmptyPayload> = {
		authToken: get(userState).authToken,
		payload: {}
	};
	socket.emit(messageTypes.END_PRESENTATION, msg);
}


function logParticipants(participants: Array<Record<string, unknown>>) {
	console.info('Got a list of participants:', participants);
	for (const f in participants) {
		const { id, display, setup, muted } = participants[f];
		console.info('>> [' + id + '] ' + display + ' (setup=' + setup + ', muted=' + muted + ')');
	}
}


function handleExternalRevealStateChange(state: Partial<RevealState>) {
	// inform iframe
	const iframe = document.querySelector(
		`iframe#${presentationIframeId}`
	) as HTMLIFrameElement;
	if (iframe) {
		const data = {
			type: messageTypes.REVEAL_STATE_CHANGED,
			state,
		};
		iframe.contentWindow.postMessage(data, '*');
	}
}


function setHydrogenRoom(roomId: string) {
	const iframe = getHydrogenIframe();
	iframe.contentWindow.postMessage(
		{
			type: 'HYDROGEN_LOAD_ROOM',
			payload: { roomId }
		},
		'*'
	);

	const msg: Message<MatrixRoomPayload> = {
		authToken: get(userState).authToken,
		payload: { roomId }
	};
	socket.emit(messageTypes.MATRIX_ROOM_CHANGE, msg);

	moduleState.update(
		(prev) => R.assocPath(
			['chatState', 'matrixRoomId'], roomId, prev
		)
	);
}


function getHydrogenIframe() {
	return document.querySelector('iframe#hydrogen') as HTMLIFrameElement;
}


function chatSendUrl(roomId: string, url: string) {
	const iframe = getHydrogenIframe();
	iframe.contentWindow.postMessage(
		{
			type: 'HYDROGEN_SEND_MESSAGE',
			payload: {
				roomId,
				content: `navigated to: ${url}`
			}
		},
		'*'
	);
}


async function main() {
	const setWikiUrl = (wikipediaUrl: string) => {
		// receives the actual url of the wikipedia page,
		// which we then proxy

		// wikipediaUrl can be a URL or just one or more words
		const regex = /https?:/;
		if (!regex.test(wikipediaUrl)) {
			wikipediaUrl = `${wikipediaBaseUrl}/wiki/${wikipediaUrl}`;
		}

		const proxyUrl = `${serverUrl}/${proxyPathWikipedia}`;
		const proxiedUrl = getProxiedUrl(proxyUrl, wikipediaUrl);

		const msg: Message<UrlPayload> = {
			authToken: get(userState).authToken,
			payload: { url: proxiedUrl }
		};
		socket.emit(messageTypes.WIKIPEDIA_URL_CHANGED, msg);
		const { matrixRoomId } = get(moduleState).chatState;
		chatSendUrl(
			matrixRoomId,
			urlFromProxiedUrl(proxiedUrl)
		);

		moduleState.update(
			(prev) => R.assocPath(
				['wikipediaState', 'url'], proxiedUrl, prev
			)
		);
	};

	const wikiJumpToSection = (hash: string) => {
		const proxiedUrl = get(moduleState).wikipediaState.url;
		const wikipediaUrl = decodeURIComponent(
			proxiedUrl.split(`/${proxyPathWikipedia}/`)[1]
		);
		const url = new URL(wikipediaUrl);
		url.hash = hash;
		setWikiUrl(url.toString());
	};

	/* const app = */ new App({
		target: document.querySelector('#App'),
		props: {
			userState,
			roomState,
			moduleState,
			audioState,
			claimAdmin,
			// setUserName,
			setActiveModule,
			setHydrogenRoom,
			setWikiUrl,
			wikiJumpToSection,
			startPres: startPresentation,
			stopPres: stopPresentation,

			// TODO: needed?
			onPresentationLoaded: () => {
				const msg: Message<EmptyPayload> = {
					payload: {}
				};
				socket.emit(messageTypes.GET_FULL_STATE, msg);
			},

			startAudio: () => startAudio(),
			stopAudio: () => stopAudio(),
			toggleMute: () => toggleMute(),
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
		const msg: Message<EmptyPayload> = { payload: {} };
		socket.emit(messageTypes.GET_FULL_STATE, msg);

		socket.on(messageTypes.ADMIN_TOKEN, (msg: Message<AuthTokenPayload>) => {
			const { token } = msg.payload;
			if (!token) {
				return alert('denied');
			}
			userState.update((prev) => ({ ...prev, authToken: token }));
		});

		socket.on(messageTypes.ROOM_UPDATE, (msg: Message<RoomState>) => {
			const newState = msg.payload;
			roomState.update((prev) => ({ ...prev, ...newState }));
		});

		socket.on(messageTypes.MODULE_UPDATE, (msg: Message<ModuleState>) => {
			const newState = msg.payload;
			moduleState.update((prev) => {
				handleExternalRevealStateChange(newState.presentationState.state);
				return { ...prev, ...newState };
			});
		});

		socket.on(messageTypes.REVEAL_STATE_CHANGED, (msg: Message<RevealStateChangePayload>) => {
			const { state } = msg.payload;
			handleExternalRevealStateChange(state);
		});

		// messages from iframe(s)
		window.addEventListener('message', (msg) => {
			const { /* origin, */ data } = msg;
			const { authToken } = get(userState);

			if (data.type === messageTypes.REVEAL_STATE_CHANGED) {
				if (!authToken) { return; }
				const msg: Message<RevealStateChangePayload> = {
					authToken,
					payload: { state: data.state }
				};
				socket.emit(messageTypes.REVEAL_STATE_CHANGED, msg);
			} else if (data.type === messageTypes.REVEAL_WIKIPEDIA_LINK) {
				if (!authToken) { return; }
				const { url } = data;
				setActiveModule(moduleTypes.WIKIPEDIA);
				setWikiUrl(url);
			} else if (data.type === messageTypes.WIKIPEDIA_SECTION_CHANGED) {
				const { hash } = data;
				moduleState.update(
					(prev) => R.assocPath(
						['wikipediaState', 'activeSectionHash'], hash, prev
					)
				);
			} else if (data.type === messageTypes.WIKIPEDIA_URL_CHANGED) {
				if (!authToken) { return; }
				const { url } = data;
				if (url === get(moduleState).wikipediaState.url) {
					return;
				}
				moduleState.update(
					(prev) => R.assocPath(
						['wikipediaState', 'url'], url, prev
					)
				);
				const msg: Message<UrlPayload> = { authToken, payload: { url } };
				socket.emit(messageTypes.WIKIPEDIA_URL_CHANGED, msg);
				const { matrixRoomId } = get(moduleState).chatState;
				chatSendUrl(matrixRoomId, url);
			} else if (data.type === messageTypes.REVEAL_URL_CHANGED) {
				if (!authToken) { return; }
				const { url } = data;
				if (url === get(moduleState).presentationState.url) {
					return;
				}
				moduleState.update(
					(prev) => R.assocPath(
						['presentationState', 'url'], url, prev
					)
				);
				const msg: Message<UrlPayload> = { authToken, payload: { url } };
				socket.emit(messageTypes.REVEAL_URL_CHANGED, msg);
			} else if (data.type === messageTypes.HYDROGEN_READY) {
				const { userId, displayName } = data.payload;
				userState.update((prev) => ({
					...prev,
					matrixUserId: userId
				}));
				setHydrogenRoom(matrixRoomId);
				setUserName(displayName);
			}
		});
	});

	// -------- audio --------
	let janus: Janus;
	let audioBridge: PluginHandle;

	function joinHandler(msg: PluginMessage) {
		// Successfully joined, negotiate WebRTC now
		if (msg.id) {
			console.info('Successfully joined room ' + msg.room + ' with ID ' + msg.id);
			audioState.update((prev) => ({ ...prev, janusParticipantId: msg.id }));
			sendUserInfo();
			if (!get(audioState).connected) {
				audioState.update((prev) => ({ ...prev, connected: true }));
				// Publish our stream
				audioBridge.createOffer({
					iceRestart: true,
					media: { video: false }, // This is an audio only room
					success: (jsep: JSEP) => {
						// console.info('Got SDP!', jsep);
						const publish = { request: 'configure', muted: false };
						audioBridge.send({ message: publish, jsep: jsep });
					},
					error: (error: unknown) => {
						console.error('WebRTC error:', error);
					}
				});
			}
		}

		if (msg.participants) {
			logParticipants(msg.participants);
		}
	}

	function roomChangedHandler(msg: PluginMessage) {
		console.info('Moved to room ' + msg.room + ', new ID: ' + msg.id);
		if (msg.participants) {
			logParticipants(msg.participants);
		}
		return msg.id;
	}

	function eventHandler(msg: PluginMessage) {
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
		sendUserInfo();
	}

	const callbacks = {
		onmessage: (msg: PluginMessage, jsep: JSEP) => {
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
					sendUserInfo();
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
			sendUserInfo();
		},

		oncleanup: () => {
			// the WebRTC PeerConnection with the plugin was closed
			// The plugin handle is still valid so we can create a new one

			audioState.update((prev) => ({ ...prev, connected: false }));
			sendUserInfo();
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
		audioBridge.send({ message: register });
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
		sendUserInfo();
	};
}


main();
export {};
