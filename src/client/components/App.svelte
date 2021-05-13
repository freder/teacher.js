<script>
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';

	export let userId;
	export let claimAdmin;
	export let log;
	export let roomState;

	const role = derived(
		roomState,
		($roomState) => ($roomState.adminIds.includes($userId)) ? 'admin' : 'user'
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
	#container {
		display: flex;
		flex-direction: row;
		height: 100%;
	}

	#room-panel {
		flex-grow: 0;
		flex-shrink: 0;
		width: 300px;
		background: gold;
		padding: 10px;
	}

	#main {
		flex: 1;
		padding: 10px;
	}

	.userlist {
		margin: 0;
		padding: 0;
		padding-left: 1em;
	}

	#log {
		font-family: monospace;
	}

	iframe#presentation {
		width: 100%;
		height: 80vh;
	}
</style>

<div id="container">
	<div id="room-panel">
		<div>
			role: <span>{$role}</span>
			{#if $role !== 'admin'}
				{' '}
				<button on:click={claimAdmin}>
					claim admin role
				</button>
			{/if}
		</div>

		<hr>

		<div>participants:</div>
		<ul class="userlist">
			{#each $roomState.users as user}
				<li>
					{user.name}
					{#if user.socketId === $userId}
						{' (you)'}
					{/if}
					{#if $roomState.adminIds.includes(user.socketId)}
						{' (admin)'}
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	<div id="main">
		<div>
			<!-- svelte-ignore a11y-missing-attribute -->
			<iframe
				id="presentation"
				src="https://kastalia.medienhaus.udk-berlin.de/11995"
			></iframe>
		</div>

		<hr>

		<div>
			<div>event log:</div>
			<div id="log">
				{#each $log as entry}
					<div>{entry}</div>
				{/each}
			</div>
		</div>
	</div>
</div>
