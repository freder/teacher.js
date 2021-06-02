import { wikipediaBaseUrl } from './constants';


export function getWikipediaTocUrl(wikiPageUrl: string): string {
	const _url = new URL(wikiPageUrl); // https://en.wikipedia.org/wiki/asdf
	const page = _url.pathname.replace('/wiki/', ''); // "/wiki/asdf"
	const args = 'prop=sections&format=json';
	return `${wikipediaBaseUrl}/w/api.php?action=parse&page=${page}&${args}`;
}


export function getISOTimestamp(): string {
	return (new Date()).toISOString();
}
