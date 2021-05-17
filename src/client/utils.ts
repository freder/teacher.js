export function getWikipediaTOC(
	wikiPageUrl: string
): Promise<Record<string, unknown>> {
	const _url = new URL(wikiPageUrl); // https://en.wikipedia.org/wiki/asdf
	const page = _url.pathname.replace('/wiki/', ''); // "/wiki/asdf"
	const host = 'https://en.wikipedia.org';
	const args = 'prop=sections&format=json';
	const url = `${host}/w/api.php?action=parse&page=${page}&${args}`;
	return fetch(url).then((res) => res.json());
}
