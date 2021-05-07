<script>
	// props are 'exported'
	export let answer;
	console.log('all passed in props were:', $$props);

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function doSomething() {
		alert('yep');
	}
</script>

<p>{answer}</p>
{#if answer === 42}
	<button on:click|once={doSomething}>kfkfkf</button>
{:else}
	this is weird
{/if}

<!--
{#each cats as cat, i (cat.id)}
	...
{/each}
-->

<!--
<input bind:value={name}>
-->

<!--
<div
	contenteditable="true"
	bind:innerHTML={html}
></div>
-->
