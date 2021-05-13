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

	janus.attach({
		plugin: 'janus.plugin.echotest',
		success: (pluginHandle) => {
			console.log(pluginHandle);
		},
		error: (cause: string) => {
			console.error(cause);
		},
		// consentDialog: (on) => {
		// 	// e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise
		// },
		// onmessage: (msg, jsep) => {
		// 	// We got a message/event (msg) from the plugin
		// 	// If jsep is not null, this involves a WebRTC negotiation
		// },
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
