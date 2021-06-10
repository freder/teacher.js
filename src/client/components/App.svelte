<script>
	import { derived } from 'svelte/store';
	import * as R from 'ramda';

	import { moduleTypes, proxyPathWikipedia } from '../../shared/constants';

	import AudioControls from './AudioControls.svelte';
	import ParticipantsList from './ParticipantsList.svelte';
	import Wikipedia from './Wikipedia.svelte';
	import WikipediaControls from './WikipediaControls.svelte';
	import Chat from './Chat.svelte';
	import ChatControls from './ChatControls.svelte';
	import Presentation from './Presentation.svelte';
	import PresentationControls from './PresentationControls.svelte';
	// import EventLog from './EventLog.svelte';

	export let userState;
	// export let uiState;
	export let roomState;
	export let moduleState;
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
	// export let setUserName;
	export let setHydrogenRoom;

	let kastaliaId;

	const role = derived(
		roomState,
		($roomState) => ($roomState.adminIds.includes($userState.socketId))
			? 'admin'
			: 'user'
	);

	const isLoggedIn = derived(
		userState,
		($userState) => Boolean($userState.matrixUserId)
	);

	const activatePresentation = R.partial(
		setActiveModule, [moduleTypes.PRESENTATION]
	);
	const activateWikipedia = R.partial(
		setActiveModule, [moduleTypes.WIKIPEDIA]
	);
	const activateChat = R.partial(
		setActiveModule, [moduleTypes.CHAT]
	);

	const wikiJumpToSection = (hash) => {
		const proxiedUrl = $moduleState.url;
		const wikipediaUrl = decodeURIComponent(
			proxiedUrl.split(`/${proxyPathWikipedia}/`)[1]
		);
		const url = new URL(wikipediaUrl);
		url.hash = hash;
		setWikiUrl(url.toString());
	}

	// const updateName = () => {
	// 	const name = prompt();
	// 	// can't be empty
	// 	if (!name || name.trim() === '') {
	// 		return;
	// 	}
	// 	// force unique
	// 	const names = $roomState.users.map(({ name }) => name);
	// 	if (names.includes(name)) {
	// 		alert('name is already taken');
	// 		return;
	// 	}
	// 	setUserName(name);
	// };
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

	.hidden-during-login {
		visibility: hidden;
	}
</style>

<div id="container">
	<div
		id="header"
		class={`
			padded
			${$isLoggedIn ? '' : 'hidden-during-login'}
		`}
	>
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
					class:active={$moduleState.activeModule === moduleTypes.PRESENTATION}
					on:click={activatePresentation}
				>
					Presentation
				</button>
				<button
					class:active={$moduleState.activeModule === moduleTypes.WIKIPEDIA}
					on:click={activateWikipedia}
				>
					Wikipedia
				</button>
				<button
					class:active={$moduleState.activeModule === moduleTypes.CHAT}
					on:click={activateChat}
				>
					Chat
				</button>

				<!-- CONTEXTUAL OPTIONS -->
				{#if $moduleState.activeModule === moduleTypes.PRESENTATION}
					<PresentationControls
						kastaliaId={kastaliaId}
						startPres={startPres}
						stopPres={stopPres}
					/>
				{:else if $moduleState.activeModule === moduleTypes.WIKIPEDIA}
					<WikipediaControls
						setWikiUrl={setWikiUrl}
						wikiJumpToSection={wikiJumpToSection}
						activeSectionHash={$moduleState.activeSectionHash}
						url={
							decodeURIComponent(
								R.last((
									$moduleState.url || ''
								).split('/'))
							)
						}
					/>
				{:else if $moduleState.activeModule === moduleTypes.CHAT}
					<ChatControls
						roomId={$moduleState.matrixRoomId}
						setHydrogenRoom={setHydrogenRoom}
					/>
				{/if}
			{/if}
		</div>
	</div>

	<div id="main">
		<div
			id="panel"
			class={`
				${$isLoggedIn ? '' : 'hidden-during-login'}
			`}
		>
			<div class="padded">
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
					userState={$userState}
					roomState={$roomState}
				/>
			</div>
		</div>

		<div id="content-container">
			<div style="flex: 1;">
				{#if (
					!$isLoggedIn ||
					$moduleState.activeModule === moduleTypes.CHAT
				)}
					<Chat login={!$isLoggedIn} />
				{:else if ($moduleState.activeModule === moduleTypes.PRESENTATION) && $moduleState.url}
					<Presentation
						url={$moduleState.url}
						onPresentationLoaded={onPresentationLoaded}
					/>
				{:else if ($moduleState.activeModule === moduleTypes.WIKIPEDIA) && $moduleState.url}
					<Wikipedia url={$moduleState.url} />
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
