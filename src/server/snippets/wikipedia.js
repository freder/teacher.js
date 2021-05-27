(() => {
	const allLinks = document.querySelectorAll('a[href]');
	allLinks.forEach((elem) => {
		const href = elem.attributes.href.value;
		const url = new URL(href, document.baseURI).href;
		// TODO: don't hardcode server url
		elem.attributes.href.value = 'http://localhost:3000/proxy/wikipedia/' + encodeURIComponent(url);
	});

	// TODO:
	// - on load event
		// .replace('<body', '<body onload="alert(location.href)"')
	// - postMessage to parent page
})();

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
