import fetch from 'node-fetch';
import type express from 'express';
import LRU from 'lru-cache';

import {
	kastaliaBaseUrl,
	proxyPathKastalia,
	proxyPathWikipedia
} from '../shared/constants';


const {
	FRONTEND_PROTOCOL,
	FRONTEND_HOST,
	FRONTEND_PORT,
	FRONTEND_PATH,
} = process.env;
const frontendUrl = `${FRONTEND_PROTOCOL}://${FRONTEND_HOST}:${FRONTEND_PORT}/${FRONTEND_PATH}`;

const cache = new LRU({
	max: 100,
	maxAge: 5 * 60 * 1000,
});


export function initProxy(app: express.Application): void {
	// generic proxy to bypass CORS, etc.
	app.get('/proxy/:url', (req, res) => {
		const url = new URL(
			decodeURIComponent(req.params.url)
		);
		fetch(url.toString())
			.then((res) => res.text())
			.then((txt) => res.send(txt));
	});

	// http://.../proxy/wikipedia/https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FDocumentary_Now!
	app.get(`/${proxyPathWikipedia}/:url`, (req, res) => {
		// decode url and remove hash
		const url = new URL(
			decodeURIComponent(req.params.url)
		);
		url.hash = '';
		const urlStr = url.toString();

		// we may or may not have this cached:
		let promise = cache.get(urlStr) as Promise<string> | undefined;
		if (!promise) {
			promise = fetch(urlStr)
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

						// remove navigation
						.replace(/mw-(navigation|page-base|head-base)"/g,'mw-$1" style="display:none;"')
						.replace(/id="content"/,'id="content" style="margin:0;"')

						// inject custom code snippet
						.replace('</body>', `<script src="${frontendUrl}wikipedia-snippet.js" defer></script></body>`);
					return output;
				});
			cache.set(urlStr, promise);
		}
		promise.then((output) => res.send(output));
	});

	// TODO: cache
	app.get(`/${proxyPathKastalia}/:kastaliaId`, (req, res) => {
		const url = new URL(kastaliaBaseUrl);
		url.pathname += `/${req.params.kastaliaId}`;
		const urlStr = url.toString();
		fetch(urlStr)
			.then((res) => res.text())
			.then((htmlStr) => {
				const output = htmlStr
					.replace(
						'</head>',
						`<base href="${url.origin}"></head>`
					)

					.replace(/src="\/(\w)/ig, `src="${url.origin}/$1`)
					.replace(/href="\/(\w)/ig, `href="${url.origin}/$1`)
					.replace(/href="#(\w)/ig, `href="${url.href}#$1`)
					.replace(/href="\/\/(\w)/ig, `href="${url.protocol}//$1`)

					.replace('</body>', `<script src="${frontendUrl}reveal-snippet.js" defer></script></body>`);

				res.send(output);
			});
	});
}
