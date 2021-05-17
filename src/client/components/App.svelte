<script context="module">
	const PRESENTATION = 'PRESENTATION';
	const WIKIPEDIA = 'WIKIPEDIA';
</script>

<script>
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';

	import { getWikipediaTOC } from '../utils';

	export let userId;
	export let log;
	export let roomState;
	export let claimAdmin;
	export let startWiki;
	export let startPres;
	export let stopPres;
	export let onPresentationLoaded;

	let contentMode;
	let kastaliaId;
	let wikipediaUrl;

	const role = derived(
		roomState,
		($roomState) => ($roomState.adminIds.includes($userId)) ? 'admin' : 'user'
	);

	// const unsubAuthToken = role.subscribe((value) => {
	// 	document.body.style.background = (value === 'admin')
	// 		? 'lightgrey'
	// 		: 'unset';
	// });

	const setContentMode = (mode) => {
		contentMode = mode;
	};

	onDestroy(() => {
		unsubAuthToken();
	});
</script>

<style>
	#container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	#header {
		background: var(--accent-color);
		border-bottom: solid 2px black;
	}

	#room-panel {
		flex-grow: 0;
		flex-shrink: 0;
		width: var(--panel-width);
		border-right: solid 2px black;
	}

	#main {
		flex: 1;
		display: flex;
	}

	#content-container {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.section-title {
		font-weight: bold;
	}

	.padded {
		padding: var(--padding);
	}

	.userlist {
		margin: 0;
		padding: 0;
		padding-left: 1em;
	}

	#log {
		font-family: monospace;
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: none;
	}

	button.selected {
		background: black;
		color: white;
	}
</style>

<div id="container">
	<div
		id="header"
		class="padded"
	>
		<div
			style="
				width: var(--panel-width);
				display: inline-block;
			"
		>
			<div>
				<!-- role: <span>{$role}</span> -->
				{#if $role !== 'admin'}
					{' '}
					<button on:click={claimAdmin}>
						claim admin role
					</button>
				{/if}
			</div>
		</div>

		<div style="display: inline-block;">
			{#if $role === 'admin'}
				<!-- TABS -->
				<button
					class:selected={contentMode === PRESENTATION}
					on:click={() => setContentMode(PRESENTATION)}
				>
					Presentation
				</button>
				<button
					class:selected={contentMode === WIKIPEDIA}
					on:click={() => setContentMode(WIKIPEDIA)}
				>
					Wikipedia
				</button>
				<span>: </span>

				<!-- CONTEXTUAL OPTIONS -->
				{#if contentMode === PRESENTATION}
					<input
						type="text"
						placeholder="Kastalia knot id"
						bind:value={kastaliaId}
						on:keydown={(event) => {
							if (event.key === 'Enter') {
								startPres(kastaliaId);
								event.target.blur();
							}
						}}
					>
					<button on:click={() => startPres(kastaliaId)}>
						start presentation
					</button>
					<button on:click={() => {
						kastaliaId = undefined;
						stopPres();
					}}>
						end presentation
					</button>
				{:else if contentMode === WIKIPEDIA}
					<input
						type="text"
						placeholder="Wikipedia URL"
						bind:value={wikipediaUrl}
						on:keydown={async (event) => {
							if (event.key === 'Enter') {
								startWiki(wikipediaUrl);
								event.target.blur();
								const toc = await getWikipediaTOC(wikipediaUrl);
							}
						}}
					>
				{/if}
			{/if}
		</div>
	</div>

	<div id="main">
		<div id="room-panel">
			<div class="padded">
				<div class="section-title">
					Participants:
				</div>
				<ul class="userlist">
					{#each $roomState.users as user}
						<li>
							<span
								style={user.socketId === $userId
									? 'background: black; color: white;'
									: ''
								}
							>
								{user.name}
							</span>
							{#if $roomState.adminIds.includes(user.socketId)}
								{' (admin)'}
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<div id="content-container">
			<div style="flex: 1;">
				{#if (contentMode === PRESENTATION) && $roomState.presentationUrl}
					<!-- svelte-ignore a11y-missing-attribute -->
					<iframe
						src={$roomState.presentationUrl}
						on:load={onPresentationLoaded}
					></iframe>
				{:else if (contentMode === WIKIPEDIA) && wikipediaUrl}
					<!-- svelte-ignore a11y-missing-attribute -->
					<iframe src={wikipediaUrl}></iframe>
				{/if}
			</div>

			<hr>

			<div
				class="padded"
				style="
					flex-grow: 0;
					max-height: 100px;
				"
			>
				<div class="section-title">
					Event log:
				</div>
				<div id="log">
					{#each $log as entry}
						<div>{entry}</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
