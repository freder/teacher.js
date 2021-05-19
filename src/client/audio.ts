import { Janus } from 'janus-gateway';
import { janusServers } from '../shared/constants';


type JanusInstance = Record<string, unknown>;
type AudioBridgeInstance = Record<string, unknown>;


export function attachAudioBridgePlugin(
	janus: JanusInstance,
	callbacks: Record<string, (...args: unknown[]) => void>
): Promise<AudioBridgeInstance> {
	return new Promise((resolve, reject) => {
		let audioBridge: AudioBridgeInstance;

		janus.attach({
			plugin: 'janus.plugin.audiobridge',

			success: (pluginHandle: AudioBridgeInstance) => {
				audioBridge = pluginHandle;
				console.log(
					'Plugin attached! (' + audioBridge.getPlugin() +
					', id=' + audioBridge.getId() + ')'
				);
				resolve(audioBridge);
			},

			error: (cause: string) => {
				console.error(cause);
				reject(new Error(cause));
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

			// onlocalstream: function(stream) {
			// 	console.log(' ::: Got a local stream :::', stream);
			// 	// We're not going to attach the local audio stream
			// },

			onremotestream: (stream: MediaStream) => {
				const audioElement = document.querySelector('audio#roomaudio') as HTMLAudioElement;
				Janus.attachMediaStream(audioElement, stream);
			},

			...callbacks
		});
	});
}


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
			server: janusServers,
			// iceServers: [], // TODO: needed?
			success: () => {
				console.log('success');
				resolve(j);
			},
			error: (cause: string) => {
				reject(new Error(cause));
			}
		});
	});
	return janus;
}
