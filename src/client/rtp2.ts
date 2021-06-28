import type { Janus, PluginHandle, PluginMessage } from 'janus-gateway';
import { janusRoomId } from '../shared/constants';
import { attachAudioBridgePlugin, initJanus } from './audio';


let janus: Janus;
let audioBridge: PluginHandle;
const button = document.querySelector('button');


const joinMsg = {
	request: 'join',
	room: janusRoomId,
	display: 'Plain RTP participant',
	rtp: {
		ip: '127.0.0.1',
		port: 2345,
		audiolevel_ext: 1,
		payload_type: 111,
		fec: true
	}
};
const otherMsg = { /* ... */ };

// all messages, in the order you want to send them in
const messages = [joinMsg, otherMsg, /* ... */];


async function main() {
	// initialization
	janus = await initJanus();
	const callbacks = {
		onmessage: (msg: PluginMessage) => {
			const event = msg.audiobridge;
			if (event) {
				console.log('received message from janus:');
				console.log(JSON.stringify(msg, null, '    '));
			}
		},
	};
	audioBridge = await attachAudioBridgePlugin(janus, callbacks);
	console.log('--------------------------------------------');

	// send the message, then waits a certain amount of time before
	// resolving the promise
	const sendWithDelayAfter = (msg: any, delay: number) => {
		return new Promise((resolve) => {
			console.log('sending:');
			console.log(msg);
			audioBridge.send({ message: msg });
			setTimeout(resolve, delay);
		});
	};

	button.addEventListener('click', async () => {
		for (const msg of messages) {
			await sendWithDelayAfter(msg, 1000);
		}
	});
}

main();
