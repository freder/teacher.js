import { messageTypes } from '../shared/constants';


declare global {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Reveal: any;
}


// check if we're in an iframe
if (window.location !== window.parent.location) {
	// register slideshow hooks
	const eventTypes = [
		'slidechanged',
		'fragmentshown',
		'fragmenthidden',
		'overviewshown',
		'overviewhidden',
	];
	const handler = () => {
		const data = {
			type: messageTypes.REVEAL_STATE_CHANGED,
			state: Reveal.getState(),
		};
		// inform parent
		window.parent.postMessage(data, '*');
	};
	eventTypes.forEach((type) => {
		Reveal.on(type, handler);
	});

	// receive commands from the parent
	window.addEventListener('message', ({ /* origin, */ data }) => {
		// TODO: check origin?
		if (data.type === messageTypes.REVEAL_STATE_CHANGED) {
			Reveal.setState(data.state);
		}
	});
}
