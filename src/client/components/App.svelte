<script>
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';

	export let authToken;
	export let claimAdmin;

	// TODO: how would one do this outside of a .svelte file?
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

<div>
	role: <span>{$role}</span>
	{' '}
	<button on:click={claimAdmin}>
		claim admin role
	</button>
	{' '}
	<span>{$authToken}</span>
</div>
