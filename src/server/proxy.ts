import fetch from 'node-fetch';
import type express from 'express';

import { proxyPathWikipedia } from '../shared/constants';


const {
	FRONTEND_PROTOCOL,
	FRONTEND_HOST,
	FRONTEND_PORT,
	FRONTEND_PATH,
} = process.env;
const frontendUrl = `${FRONTEND_PROTOCOL}://${FRONTEND_HOST}:${FRONTEND_PORT}/${FRONTEND_PATH}`;


export function initProxy(app: express.Application): void {
	// generic proxy to bypass CORS, etc.
	app.get('/proxy/:url', (req, res) => {
		const urlStr = decodeURIComponent(req.params.url);
		fetch(urlStr)
			.then((res) => res.text())
			.then((txt) => res.send(txt));
	});

	// http://.../proxy/wikipedia/https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FDocumentary_Now!
	// TODO: cache the output / response
	app.get(`/${proxyPathWikipedia}/:url`, (req, res) => {
		const urlStr = decodeURIComponent(req.params.url);
		const url = new URL(urlStr);
		url.hash = '';
		fetch(urlStr)
			.then((res) => res.text())
			.then((htmlStr) => {
				const output = htmlStr
					// this makes `srcset` attributes work...
					.replace(
						'</head>',
						`<base href="${url.origin}"></head>`
					)
					// ... anything else should end up being rewritten
					// as absolute / complete URL:
					.replace(/src="\/(\w)/ig, `src="${url.origin}/$1`)
					.replace(/href="\/(\w)/ig, `href="${url.origin}/$1`)
					.replace(/href="#(\w)/ig, `href="${url.href}#$1`)
					.replace(/href="\/\/(\w)/ig, `href="${url.protocol}//$1`)
					// inject custom code snippet
					.replace('</body>', `<script src="${frontendUrl}/wikipedia-snippet.js"></script></body>`);
				res.send(output);
			});
	});
}
