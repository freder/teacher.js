import type { Janus, PluginHandle } from 'janus-gateway';
import { janusRoomId } from '../shared/constants';
import { attachAudioBridgePlugin, initJanus } from './audio';


let janus: Janus;
let audioBridge: PluginHandle;
const input = document.querySelector('#input') as HTMLPreElement;
const output = document.querySelector('#output') as HTMLPreElement;
const button = document.querySelector('button');
const label = document.querySelector('#label') as HTMLSpanElement;

// https://github.com/meetecho/janus-gateway/pull/2464
const defaultMsg = {
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


const send = () => {
	const message = JSON.parse(input.innerText);
	console.log(message);
	audioBridge.send({ message });
};


async function main() {
	janus = await initJanus();
	const callbacks = {
		onmessage: (msg: PluginMessage) => {
			const event = msg.audiobridge;
			if (event) {
				// show last received message
				output.innerText = JSON.stringify(msg, null, '    ');

				// once we receive joined event, show label
				if (event === 'joined') {
					label.style.display = 'inline';
				}
			}
		},
	};
	audioBridge = await attachAudioBridgePlugin(janus, callbacks);

	input.innerText = JSON.stringify(defaultMsg, null, '    ');
	button.addEventListener('click', send);
}


main();
