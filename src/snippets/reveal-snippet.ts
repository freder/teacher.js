import { messageTypes, wikipediaBaseUrl } from '../shared/constants';


declare global {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Reveal: any;
}


function checkIframe() {
	return (window.location !== window.parent.location);
}


function registerHook() {
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


function initWikipediaLinks() {
	const wikiHost = (new URL(wikipediaBaseUrl)).host;
	const allLinks = document.querySelectorAll('a[href]');
	allLinks.forEach((elem) => {
		const href = elem.getAttribute('href');
		const url = new URL(href);
		if (url.host === wikiHost) {
			elem.addEventListener('click', (event) => {
				// don't actually go there
				event.preventDefault();
				// tell parent to open link in wikipedia module
				const data = {
					type: messageTypes.REVEAL_WIKIPEDIA_LINK,
					url: href,
				};
				window.parent.postMessage(data, '*');
			});
		}
	});
}


function init() {
	// check if we're in an iframe
	if (checkIframe()) {
		// does this make a difference?
		Reveal.configure({ embedded: true });
		registerHook();
		initWikipediaLinks();
	}
}


if (
	document.readyState === 'interactive' ||
	document.readyState === 'complete'
) {
	init();
} else {
	document.addEventListener('DOMContentLoaded', init);
}
