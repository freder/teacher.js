<script>
	import { derived } from 'svelte/store';

	import { getWikipediaTocUrl } from '../utils';
	import { serverUrl } from '../constants';
	import { moduleTypes } from '../../shared/constants';

	export let userState;
	export let uiState;
	export let roomState;
	export let audioState;
	export let claimAdmin;
	export let setWikiUrl;
	export let setActiveModule;
	export let startPres;
	export let stopPres;
	export let onPresentationLoaded;
	export let startAudio;
	export let stopAudio;
	export let toggleMute;

	let kastaliaId;
	let wikipediaToc;

	const role = derived(
		roomState,
		($roomState) => ($roomState.adminIds.includes($userState.userId)) ? 'admin' : 'user'
	);

	// $: {
	// 	document.body.style.background = ($role === 'admin')
	// 		? 'lightgrey'
	// 		: 'unset';
	// }

	const wikiJumpToSection = (event) => {
		const anchor = event.target.value;
		const url = new URL($roomState.wikipediaUrl);
		url.hash = `#${anchor}`;
		setWikiUrl(url.toString());
		event.target.value = '';
	}

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
		background: var(--header-color);
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

			<div>
				<button
					on:click={$audioState.audioStarted ? stopAudio : startAudio}
				>
					{$audioState.audioStarted ? 'stop' : 'start'} audio
				</button>
				<button
					on:click={toggleMute}
					disabled={!$audioState.audioStarted}
				>
					{$audioState.muted ? 'unmute' : 'mute'}
				</button>
			</div>

			{#if $role === 'admin'}
				<div>
					<button on:click={startPres}>start presentation</button>
					<button on:click={stopPres}>end presentation</button>
				</div>
			{/if}
		</div>

		<div style="display: inline-block;">
			{#if $role === 'admin'}
				<!-- TABS -->
				<button
					class:selected={$roomState.activeModule === moduleTypes.PRESENTATION}
					on:click={() => setActiveModule(moduleTypes.PRESENTATION)}
				>
					Presentation
				</button>
				<button
					class:selected={$roomState.activeModule === moduleTypes.WIKIPEDIA}
					on:click={() => setActiveModule(moduleTypes.WIKIPEDIA)}
				>
					Wikipedia
				</button>
				<span>: </span>

				<!-- CONTEXTUAL OPTIONS -->
				{#if $roomState.activeModule === moduleTypes.PRESENTATION}
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
				{:else if $roomState.activeModule === moduleTypes.WIKIPEDIA}
					<input
						type="text"
						placeholder="Wikipedia URL"
						on:keydown={(event) => {
							if (event.key === 'Enter') {
								const wikipediaUrl = event.target.value;
								setWikiUrl(wikipediaUrl);
								event.target.blur();
								const url = getWikipediaTocUrl(wikipediaUrl);
								fetch(`${serverUrl}/proxy/${encodeURIComponent(url)}`)
									.then((res) => res.json())
									.then((toc) => { wikipediaToc = toc.parse.sections; });
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
				{/if}
			{:else}
				<!--  -->
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
				{#if ($roomState.activeModule === moduleTypes.PRESENTATION) && $roomState.presentationUrl}
					<!-- svelte-ignore a11y-missing-attribute -->
					<iframe
						id="presentation"
						src={$roomState.presentationUrl}
						on:load={onPresentationLoaded}
					></iframe>
				{:else if ($roomState.activeModule === moduleTypes.WIKIPEDIA) && $roomState.wikipediaUrl}
					<!-- svelte-ignore a11y-missing-attribute -->
					<iframe
						id="wikipedia"
						src={$roomState.wikipediaUrl}
					></iframe>
				{/if}
			</div>

			<!-- <hr>

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
					{#each $uiState.log as entry}
						<div>{entry}</div>
					{/each}
				</div>
			</div> -->
		</div>
	</div>
</div>
