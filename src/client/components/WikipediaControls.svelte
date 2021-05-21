<script>
	import { serverUrl } from '../constants';

	export let setWikiUrl;
	export let getWikipediaTocUrl;
	export let wikiJumpToSection;

	let wikipediaToc;

	const handleUrl = (event) => {
		const wikipediaUrl = event.target.value;
		setWikiUrl(wikipediaUrl);
		event.target.blur();
		const url = getWikipediaTocUrl(wikipediaUrl);
		fetch(`${serverUrl}/proxy/${encodeURIComponent(url)}`)
			.then((res) => res.json())
			.then((toc) => { wikipediaToc = toc.parse.sections; });
	};
</script>

<input
	type="text"
	placeholder="Wikipedia URL"
	on:keydown={(event) => {
		if (event.key === 'Enter') {
			handleUrl(event);
		}
	}}
>
{#if wikipediaToc}
	<span>jump to: </span>
	<!-- svelte-ignore a11y-no-onchange -->
	<select on:change={wikiJumpToSection}>
		<option value="">[select section]</option>
		{#each wikipediaToc as section}
			<option value={section.anchor}>
				{'–'.repeat(section.toclevel - 1)} {section.line}
			</option>
		{/each}
	</select>
{/if}
