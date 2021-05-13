import { Janus } from 'janus-gateway';


type JanusInstance = any;


export async function initJanus(): Promise<JanusInstance> {
	await new Promise<void>((resolve) => {
		Janus.init({
			debug: process.env.NODE_ENV === 'development',
			dependencies: Janus.useDefaultDependencies(),
			callback: () => resolve(),
		});
	});

	const janus = await new Promise<JanusInstance>((resolve, reject) => {
		const j = new Janus({
			server: [
				'ws://0.teacher.solar:8188/',
				'http://0.teacher.solar:8088/janus'
			],
			// iceServers: [],
			success: () => {
				console.log('success');
				resolve(j);
			},
			error: (cause: string) => {
				reject(new Error(cause));
			}
		});
	});

	let mixertest: any;
	let myid = null;
	let webrtcUp = false;
	const myroom = 1234; // Demo room
	let myusername = null;
	// let audioenabled = false;

	janus.attach({
		plugin: 'janus.plugin.audiobridge',
		success: (pluginHandle) => {
			mixertest = pluginHandle;
			console.log(
				'Plugin attached! (' + mixertest.getPlugin() +
				', id=' + mixertest.getId() + ')'
			);

			const username = 'asdfasdf';
			const register = {
				request: 'join',
				room: myroom,
				display: username
			};
			myusername = username;
			mixertest.send({ message: register});
		},
		error: (cause: string) => {
			console.error(cause);
		},
		// consentDialog: (on) => {
		// 	// e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise
		// },
		iceState: (state) => {
			console.log('ICE state changed to ' + state);
		},
		mediaState: (medium, on: boolean) => {
			console.log(
				'Janus ' + (on ? 'started' : 'stopped') +
				' receiving our ' + medium
			);
		},
		webrtcState: (on: boolean) => {
			console.log(
				'Janus says our WebRTC PeerConnection is ' +
				(on ? 'up' : 'down') + ' now'
			);
		},
		onmessage: (msg, jsep) => {
			// We got a message/event (msg) from the plugin
			// If jsep is not null, this involves a WebRTC negotiation
			console.log(' ::: Got a message :::', msg);
			const event = msg['audiobridge'];
			console.log('Event: ' + event);
			if (event) {
				if (event === 'joined') {
					// Successfully joined, negotiate WebRTC now
					if (msg['id']) {
						myid = msg['id'];
						console.log('Successfully joined room ' + msg['room'] + ' with ID ' + myid);
						if (!webrtcUp) {
							webrtcUp = true;
							// Publish our stream
							mixertest.createOffer({
								media: { video: false }, // This is an audio only room
								success: (jsep) => {
									console.log('Got SDP!', jsep);
									const publish = { request: 'configure', muted: false };
									mixertest.send({ message: publish, jsep: jsep });
								},
								error: (error) => {
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
				} else if (event === 'roomchanged') {
					// The user switched to a different room
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
				} else if (event === 'destroyed') {
					// The room has been destroyed
					console.warn('The room has been destroyed!');
				} else if (event === 'event') {
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
			}
			if (jsep) {
				console.log('Handling SDP as well...', jsep);
				mixertest.handleRemoteJsep({ jsep: jsep });
			}
		},
		// onlocaltrack: (track, added) => {
		// 	// A local track to display has just been added (getUserMedia worked!) or removed
		// },
		// onremotetrack: (track, mid, added) => {
		// 	// A remote track (working PeerConnection!) with a specific mid has just been added or removed
		// },
		// oncleanup: () => {
		// 	// PeerConnection with the plugin closed, clean the UI
		// 	// The plugin handle is still valid so we can create a new one
		// },
		// detached: () => {
		// 	// Connection with the plugin closed, get rid of its features
		// 	// The plugin handle is not valid anymore
		// }
	});

	return janus;
}
