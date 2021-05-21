<script>
	import { derived } from 'svelte/store';
	import * as R from 'ramda';

	import { getWikipediaTocUrl } from '../utils';
	import { moduleTypes } from '../../shared/constants';

	import AudioControls from './AudioControls.svelte';
	import ParticipantsList from './ParticipantsList.svelte';
	import Wikipedia from './Wikipedia.svelte';
	import WikipediaControls from './WikipediaControls.svelte';
	import Presentation from './Presentation.svelte';
	import PresentationControls from './PresentationControls.svelte';
	// import EventLog from './EventLog.svelte';

	export let userState;
	// export let uiState;
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
	export let setUserName;

	let kastaliaId;

	const role = derived(
		roomState,
		($roomState) => ($roomState.adminIds.includes($userState.userId))
			? 'admin'
			: 'user'
	);

	const activatePresentation = R.partial(
		setActiveModule, [moduleTypes.PRESENTATION]
	);
	const activateWikipedia = R.partial(
		setActiveModule, [moduleTypes.WIKIPEDIA]
	);

	const wikiJumpToSection = (event) => {
		const anchor = event.target.value;
		const url = new URL($roomState.wikipediaUrl);
		url.hash = `#${anchor}`;
		setWikiUrl(url.toString());
		event.target.value = '';
	}

	const updateName = () => {
		const name = prompt();
		// can't be empty
		if (!name || name.trim() === '') {
			return;
		}
		// force unique
		const names = $roomState.users.map(({ name }) => name);
		if (names.includes(name)) {
			alert('name is already taken');
			return;
		}
		setUserName(name);
	};
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

	#header > div {
		display: inline-block;
	}
	#header > div:first-child {
		width: var(--panel-width);
	}

	#main {
		flex: 1;
		display: flex;
	}

	#panel {
		flex-grow: 0;
		flex-shrink: 0;
		width: var(--panel-width);
		border-right: solid 2px black;
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

	/* .log {
		flex-grow: 0;
		max-height: 100px;
	} */
</style>

<div id="container">
	<div id="header" class="padded">
		<div>
			{#if $role !== 'admin'}
				<button on:click={claimAdmin}>
					claim admin role
				</button>
			{/if}
		</div>

		<div>
			{#if $role === 'admin'}
				<!-- TABS -->
				<button
					class:active={$roomState.activeModule === moduleTypes.PRESENTATION}
					on:click={activatePresentation}
				>
					Presentation
				</button>
				<button
					class:active={$roomState.activeModule === moduleTypes.WIKIPEDIA}
					on:click={activateWikipedia}
				>
					Wikipedia
				</button>

				<!-- CONTEXTUAL OPTIONS -->
				{#if $roomState.activeModule === moduleTypes.PRESENTATION}
					<PresentationControls
						kastaliaId={kastaliaId}
						startPres={startPres}
						stopPres={stopPres}
					/>
				{:else if $roomState.activeModule === moduleTypes.WIKIPEDIA}
					<WikipediaControls
						setWikiUrl={setWikiUrl}
						getWikipediaTocUrl={getWikipediaTocUrl}
						wikiJumpToSection={wikiJumpToSection}
					/>
				{/if}
			{/if}
		</div>
	</div>

	<div id="main">
		<div id="panel">
			<div class="padded">
				<button on:click={updateName}>
					set user name
				</button>

				<AudioControls
					audioState={audioState}
					startAudio={startAudio}
					stopAudio={stopAudio}
					toggleMute={toggleMute}
				/>
			</div>

			<hr>

			<div class="padded">
				<div class="section-title">Participants:</div>
				<ParticipantsList
					userState={userState}
					roomState={roomState}
				/>
			</div>
		</div>

		<div id="content-container">
			<div style="flex: 1;">
				{#if ($roomState.activeModule === moduleTypes.PRESENTATION) && $roomState.presentationUrl}
					<Presentation
						url={$roomState.presentationUrl}
						onPresentationLoaded={onPresentationLoaded}
					/>
				{:else if ($roomState.activeModule === moduleTypes.WIKIPEDIA) && $roomState.wikipediaUrl}
					<Wikipedia url={$roomState.wikipediaUrl} />
				{/if}
			</div>

			<!-- <hr>

			<div class="padded log">
				<div class="section-title">Event log:</div>
				<EventLog log={$uiState.log} />
			</div> -->
		</div>
	</div>
</div>
