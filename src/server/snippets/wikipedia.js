(() => {
	const allLinks = document.querySelectorAll('a[href]');
	allLinks.forEach((elem) => {
		const href = elem.attributes.href.value;
		const url = new URL(href, document.baseURI).href;
		const encodedUrl = encodeURIComponent(url);
		elem.attributes.href.value = `${location.origin}/proxy/wikipedia/${encodedUrl}`;
	});

})();

document.addEventListener('DOMContentLoaded', () => {
	// TODO: use constant for path
	const origUrl = decodeURIComponent(
		location.href.split('/proxy/wikipedia/')[1]
	);
	const data = {
		// TODO: shared constants
		// type: messageTypes.URL_CHANGED,
		type: 'URL_CHANGED',
		url: origUrl,
		// url: location.href,
	};
	// inform parent
	window.parent.postMessage(data, '*');
});

(() => {
	const headlines = [...document.querySelectorAll('#firstHeading, .mw-headline')];

	let currentHash = undefined;

	// TODO: throttle
	const scrollHandler = () => {
		// get visible elements
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

		if (filtered.length > 1) {
			filtered.sort((a, b) => {
				return a.top - b.top;
			});
		}

		// get the one closest to the top edge of the viewport
		const { elem } = filtered[0];
		const hash = `#${elem.attributes.id.value}`;

		if (hash !== currentHash) {
			currentHash = hash;

			// inform parent
			const data = {
				// TODO: shared constants
				type: /* messageTypes. */'WIKIPEDIA_SECTION_CHANGED',
				hash,
			};
			window.parent.postMessage(data, '*');
		}
	};

	window.addEventListener('scroll', scrollHandler);
})();
