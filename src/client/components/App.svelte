<script>
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';

	export let authToken;
	export let claimAdmin;
	export let log;

	const role = derived(
		authToken,
		($authToken) => ($authToken) ? 'admin' : 'user'
	);

	const unsubAuthToken = role.subscribe((value) => {
		document.body.style.background = (value === 'admin')
			? 'lightgrey'
			: 'unset';
	});

	onDestroy(() => {
		unsubAuthToken();
	});
</script>

<style>
	#log {
		font-family: monospace;
	}
</style>

<div>
	role: <span>{$role}</span>
	{' '}
	<button on:click={claimAdmin}>
		claim admin role
	</button>
</div>

<div>
	<!-- svelte-ignore a11y-missing-attribute -->
	<iframe
		id="presentation"
		src="https://kastalia.medienhaus.udk-berlin.de/11995"
		style="
			width: 100%;
			height: 80vh;
			margin-top: 1rem;
			margin-bottom: 1rem;
		"
	></iframe>
</div>

<div>
	<div>event log:</div>
	<div id="log">
		{#each $log as entry}
			<div>{entry}</div>
		{/each}
	</div>
</div>
