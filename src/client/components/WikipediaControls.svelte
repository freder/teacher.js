<script>
	import { serverUrl } from '../constants';

	export let setWikiUrl;
	// export let getWikipediaTocUrl;
	export let wikiJumpToSection;
	export let activeSectionHash;
	export let url;

	let wikipediaToc;

	const handleUrl = (event) => {
		const wikipediaUrl = event.target.value;
		setWikiUrl(wikipediaUrl);
		event.target.blur();
		// const url = getWikipediaTocUrl(wikipediaUrl);
		// fetch(`${serverUrl}/proxy/${encodeURIComponent(url)}`)
		// 	.then((res) => res.json())
		// 	.then((toc) => { wikipediaToc = toc.parse.sections; });
	};
</script>

<input
	style="min-width: 500px;"
	type="text"
	placeholder="Wikipedia URL"
	bind:value={url}
	on:keydown={(event) => {
		if (event.key === 'Enter') {
			handleUrl(event);
		}
	}}
>

{#if wikipediaToc}
	<span>section: </span>
	<!-- svelte-ignore a11y-no-onchange -->
	<select on:change={wikiJumpToSection}>
		<option value="">[select to jump]</option>
		{#each wikipediaToc as section}
			<option value={section.anchor}>
				{'–'.repeat(section.toclevel - 1)} {section.line}
			</option>
		{/each}
	</select>
{/if}

<button
	on:click={() => {
		wikiJumpToSection({
			// send fake event
			// TODO: clean this up
			target: {
				value: activeSectionHash.replace(/^#/ig, '')
			}
		});
	}}
	style={`display: ${activeSectionHash === '' ? 'none' : 'unset'};`}
>
	broadcast {activeSectionHash}
</button>
