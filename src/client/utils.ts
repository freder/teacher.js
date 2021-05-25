import UAParser from 'ua-parser-js';


export function getWikipediaTocUrl(wikiPageUrl: string): string {
	const _url = new URL(wikiPageUrl); // https://en.wikipedia.org/wiki/asdf
	const page = _url.pathname.replace('/wiki/', ''); // "/wiki/asdf"
	const host = 'https://en.wikipedia.org';
	const args = 'prop=sections&format=json';
	return `${host}/w/api.php?action=parse&page=${page}&${args}`;
}


export function makeNameFromBrowser(): string {
	const ua = new UAParser();
	const [os, br] = [ua.getOS(), ua.getBrowser()];
	return `${os.name}, ${br.name} ${br.major}`;
}
