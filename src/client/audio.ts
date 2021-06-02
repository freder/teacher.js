import { Janus, PluginHandle } from 'janus-gateway';
import { janusServers } from './constants';


export function attachAudioBridgePlugin(
	janus: Janus,
	// eslint-disable-next-line @typescript-eslint/ban-types
	callbacks: Record<string, Function>
): Promise<PluginHandle> {
	return new Promise((resolve, reject) => {
		let audioBridge: PluginHandle;

		janus.attach({
			plugin: 'janus.plugin.audiobridge',

			success: (pluginHandle) => {
				audioBridge = pluginHandle;
				// console.log(
				// 	'Plugin attached! (' + audioBridge.getPlugin() +
				// 	', id=' + audioBridge.getId() + ')'
				// );
				resolve(audioBridge);
			},

			error: (cause: string) => {
				console.error(cause);
				reject(new Error(cause));
			},

			// TODO: how is this callback not mentioned anywhere in the docs?
			onremotestream: (stream: MediaStream) => {
				const audioElement = document.querySelector('audio#roomaudio') as HTMLAudioElement;
				Janus.attachMediaStream(audioElement, stream);
			},

			// consentDialog: (on) => {
			// 	// this callback is triggered just before getUserMedia is called (parameter=true) and after it is completed (parameter=false); this means it can be used to modify the UI accordingly, e.g., to prompt the user about the need to accept the device access consent requests;
			// },

			// iceState: (state) => {
			// 	// this callback is triggered when the ICE state for the PeerConnection associated to the handle changes: the argument of the callback is the new state as a string (e.g., "connected" or "failed");
			// 	console.log('ICE state changed to ' + state);
			// },

			// mediaState: (medium, on: boolean) => {
			// 	// this callback is triggered when Janus starts or stops receiving your media: for instance, a mediaState with type=audio and on=true means Janus started receiving your audio stream (or started getting them again after a pause of more than a second); a mediaState with type=video and on=false means Janus hasn't received any video from you in the last second, after a start was detected before; useful to figure out when Janus actually started handling your media, or to detect problems on the media path (e.g., media never started, or stopped at some time);
			// 	console.log(
			// 		'Janus ' + (on ? 'started' : 'stopped') +
			// 		' receiving our ' + medium
			// 	);
			// },

			// onlocaltrack: (track, added) => {
			// 	// A local track to display has just been added (getUserMedia worked!) or removed
			// },

			// onremotetrack: (track, mid, added) => {
			// 	// A remote track (working PeerConnection!) with a specific mid has just been added or removed
			// },

			// detached: () => {
			// 	// Connection with the plugin closed, get rid of its features
			// 	// The plugin handle is not valid anymore
			// }

			// onlocalstream: function(stream) {
			// 	console.log(' ::: Got a local stream :::', stream);
			// 	// We're not going to attach the local audio stream
			// },

			...callbacks
		});
	});
}


export async function initJanus(): Promise<Janus> {
	await new Promise<void>((resolve) => {
		Janus.init({
			debug: process.env.NODE_ENV === 'development',
			dependencies: Janus.useDefaultDependencies({}),
			callback: () => resolve(),
		});
	});

	const janus = await new Promise((resolve, reject) => {
		const instance = new Janus({
			server: janusServers,
			// iceServers: [], // TODO: needed?
			success: () => {
				resolve(instance);
			},
			error: (cause: string) => {
				reject(new Error(cause));
			}
		});
	});
	return janus as Janus;
}
