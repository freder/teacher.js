import { messageTypes, proxyPathWikipedia } from '../shared/constants';
import { getProxiedUrl } from '../shared/utils';


function updateLinks() {
	const allLinks = document.querySelectorAll('a[href]');
	allLinks.forEach((elem) => {
		const wikipediaUrl = elem.getAttribute('href');
		const proxyUrl = `${location.origin}/${proxyPathWikipedia}`;
		const proxiedUrl = getProxiedUrl(proxyUrl, wikipediaUrl);
		elem.setAttribute('href', proxiedUrl);

		// instead of sending an URL change event on 'DOMContentLoaded',
		// we send it right as the link is being clicked:
		elem.addEventListener('click', (event) => {
			// don't actually go there
			event.preventDefault();

			// let parent take care of it instead
			const data = {
				type: messageTypes.URL_CHANGED,
				url: proxiedUrl,
			};
			window.parent.postMessage(data, '*');
		});
	});
}


function initSectionScrollHandler() {
	// get section headlines
	const headlines = [...document.querySelectorAll('#firstHeading, .mw-headline')];

	let currentHash: string = undefined;

	// TODO: throttle
	const scrollHandler = () => {
		// get the ones that are currently visible in the viewport
		const items = headlines.map((hl) => {
			const { top } = hl.getBoundingClientRect();
			// `top` is rel. to viewport
			const inViewport = (
				top >= 0 &&
				top <= window.innerHeight
			);
			return {
				elem: hl,
				inViewport,
				top,
			};
		});
		const filtered = items.filter((item) => item.inViewport);
		if (!filtered.length) {
			return;
		}

		// when there are more than 1 candidate, get the one closest
		// to the top edge of the viewport
		if (filtered.length > 1) {
			filtered.sort((a, b) => {
				return a.top - b.top;
			});
		}
		const { elem } = filtered[0];

		// check if the hash has changed; if so, inform the parent
		const hash = `#${elem.getAttribute('id')}`;
		if (hash !== currentHash) {
			currentHash = hash;
			const data = {
				type: messageTypes.WIKIPEDIA_SECTION_CHANGED,
				hash,
			};
			window.parent.postMessage(data, '*');
		}
	};

	window.addEventListener('scroll', scrollHandler);
}


function init() {
	updateLinks();
	initSectionScrollHandler();
}


if (
	document.readyState === 'interactive' ||
	document.readyState === 'complete'
) {
	init();
} else {
	document.addEventListener('DOMContentLoaded', init);
}
