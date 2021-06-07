import { messageTypes, proxyPathWikipedia } from '../../shared/constants';


function updateLinks() {
	const allLinks = document.querySelectorAll('a[href]');
	allLinks.forEach((elem) => {
		const wikipediaUrl = elem.getAttribute('href');
		const { href, hash } = new URL(wikipediaUrl);
		const encodedHref = encodeURIComponent(href);
		// encoded url but unencoded hash!
		elem.setAttribute(
			'href',
			`${location.origin}/${proxyPathWikipedia}/${encodedHref}${hash}`
		);
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


document.addEventListener('DOMContentLoaded', () => {
	// on page load (e.g. after cliking a link inside the iframe):
	// notify parent about the current URL, as it is not observable from the outside
	const data = {
		type: messageTypes.URL_CHANGED,
		url: location.href,
	};
	window.parent.postMessage(data, '*');
});

const init = () => {
	updateLinks();
	initSectionScrollHandler();
};

if (document.readyState === 'interactive' || document.readyState === 'complete') {
	init();
} else {
	document.addEventListener('DOMContentLoaded', init);
}
