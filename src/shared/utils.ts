export function getProxiedUrl(
	proxyUrl: string,
	wikipediaUrl: string
): string {
	// receives an URL à la
	// https://en.wikipedia.org/wiki/Documentary_Now!#Episodes
	// and returns a proxied URL

	const url = new URL(wikipediaUrl);

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
