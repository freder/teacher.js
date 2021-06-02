export function getProxiedUrl(
	proxyUrl: string,
	wikipediaUrl: string
): string {
	const url = new URL(wikipediaUrl);
	const { hash } = url;
	url.hash = '';
	const { href } = url;

	// encoded url but unencoded hash!
	const encodedHref = encodeURIComponent(href);
	const proxiedUrl = `${proxyUrl}/${encodedHref}${hash}`;
	return proxiedUrl;
}
