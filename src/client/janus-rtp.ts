import { janusRoomId } from '../shared/constants';
import { attachAudioBridgePlugin, initJanus } from './audio';


let janus: Janus;
let audioBridge: PluginHandle;
const input = document.querySelector('#input') as HTMLPreElement;
const button = document.querySelector('button');

// https://github.com/meetecho/janus-gateway/pull/2464
const defaultMsg = {
	request: 'join',
	room: janusRoomId,
	display: 'Plain RTP participant',
	rtp: {
		ip: '192.168.1.10',
		port: 2468,
		audiolevel_ext: 1,
		payload_type: 111,
		fec: true
	}
};


const send = async () => {
	const message = JSON.parse(input.innerText);
	console.log(message);
	audioBridge.send({ message });
	// {audiobridge: "event", error_code: 489, error: "Plain RTP participants not allowed in this room"}
};


async function main() {
	janus = await initJanus();
	const callbacks = {};
	audioBridge = await attachAudioBridgePlugin(janus, callbacks);

	input.innerText = JSON.stringify(defaultMsg, null, '    ');
	button.addEventListener('click', send);
}


main();
