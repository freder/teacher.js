// import * as R from 'ramda';


export function getProxiedUrl(
	proxyUrl: string,
	wikipediaUrl: string
): string {
	// receives an URL à la
	// https://en.wikipedia.org/wiki/Documentary_Now!#Episodes
	// and returns a proxied URL

	// the URL object will apparently automatically encode special
	// characters for you. so
	// https://en.wikipedia.org/wiki/Diogenes_Laërtius
	// becomes
	// https://en.wikipedia.org/wiki/Diogenes_La%C3%ABrtius
	const url = new URL(
		decodeURIComponent(wikipediaUrl)
	);

	// store the original hash
	const { hash } = url;

	// only the part of the URL up to the hash will be encoded
	url.hash = '';
	const { href } = url;
	const encodedHref = encodeURIComponent(href);

	// tack on the original hash again
	const proxiedUrl = `${proxyUrl}/${encodedHref}${hash}`;
	return proxiedUrl;
}


export function urlFromProxiedUrl(proxiedUrl: string): string {
	// TODO: why on earth does R.last cause problems?!
	// looks like as soon as we use a ramda function, wikipedia-snippet.js
	// will not execute anymore!
	const parts = (proxiedUrl || '').split('/');
	return decodeURIComponent(
		parts[parts.length - 1]
		// R.last(parts)
	);
}
