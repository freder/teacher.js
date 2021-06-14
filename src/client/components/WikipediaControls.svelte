<script>
	// import { serverUrl } from '../constants';

	export let setWikiUrl;
	// export let getWikipediaTocUrl;
	export let wikiJumpToSection;
	export let activeSectionHash;
	export let url;

	let wikipediaToc;

	const handleUrl = (wikipediaUrl) => {
		setWikiUrl(wikipediaUrl);
		event.target.blur();
		// const url = getWikipediaTocUrl(wikipediaUrl);
		// fetch(`${serverUrl}/proxy/${encodeURIComponent(url)}`)
		// 	.then((res) => res.json())
		// 	.then((toc) => { wikipediaToc = toc.parse.sections; });
	};
</script>

<input
	style="flex: 1; margin-right: var(--padding);"
	type="text"
	placeholder="Wikipedia URL"
	bind:value={url}
	on:keydown={(event) => {
		if (event.key === 'Enter') {
			handleUrl(event.target.value);
		}
	}}
>

{#if wikipediaToc}
	<span>section: </span>
	<!-- svelte-ignore a11y-no-onchange -->
	<select
		on:change={(event) => {
			wikiJumpToSection('#' + event.target.value);
			event.target.value = '';
		}}
	>
		<option value="">[select to jump]</option>
		{#each wikipediaToc as section}
			<option value={section.anchor}>
				{'–'.repeat(section.toclevel - 1)} {section.line}
			</option>
		{/each}
	</select>
{/if}

<button
	on:click={() => handleUrl(url)}
>
	go
</button>

<button
	on:click={() => wikiJumpToSection(activeSectionHash)}
	style={`display: ${activeSectionHash === '' ? 'none' : 'unset'};`}
>
	↳ {activeSectionHash}
</button>
