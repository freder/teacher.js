/* global Reveal */

// check if we're in an iframe
if (window.location !== window.parent.location) {
	// also defined in src/shared/constants.ts
	const messageType = 'reveal-state-change';

	// register slideshow hooks
	const eventTypes = [
		'slidechanged',
		'fragmentshown',
		'fragmenthidden',
	];
	const handler = () => {
		const data = {
			type: messageType,
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
		if (data.type === messageType) {
			Reveal.setState(data.state);
		}
	});
}
