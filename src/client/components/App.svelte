<script>
	import { derived } from 'svelte/store';
	import * as R from 'ramda';

	import { moduleTypes, proxyPathWikipedia } from '../../shared/constants';
	import { urlFromProxiedUrl } from '../../shared/utils';

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

	// TODO: needed?
	let kastaliaId;
	let headerIsOpen = true;
	let panelIsOpen = true;

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
	#header.open {
		padding: var(--padding);
	}
	#header.closed {
		padding: 0;
		height: 0;
		overflow: hidden;
	}

	#main {
		flex: 1;
		display: flex;
	}

	#panel {
		flex-grow: 0;
		flex-shrink: 0;
		border-right: solid 2px black;
		overflow: hidden;
	}
	#panel.open {
		width: var(--panel-width);
	}
	#panel.closed {
		width: 0;
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

	.toggle-button-container {
		position: fixed;
		z-index: 999;
	}

	.toggle-button {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
	}
</style>

<div
	class={`
		toggle-button-container
		${$isLoggedIn ? '' : 'hidden-during-login'}
	`}
	style={`
		right: var(--padding);
		top: ${headerIsOpen ? '34px' : 'var(--padding)'};
		${($role === 'admin') ? '' : 'display: none'}
	`}
>
	<button
		class="toggle-button"
		on:click={() => { headerIsOpen = !headerIsOpen; }}
	>↕︎</button>
</div>
<div
	class={`
		toggle-button-container
		${$isLoggedIn ? '' : 'hidden-during-login'}
	`}
	style={`
		left: ${panelIsOpen
			? 'calc(var(--panel-width) - 12px)'
			: 'var(--padding)' };
		top: ${headerIsOpen ? '56px' : 'var(--padding)'};
	`}
>
	<button
		class="toggle-button"
		on:click={() => { panelIsOpen = !panelIsOpen; }}
	>↔︎</button>
</div>

<div id="container">
	<div
		id="header"
		class={`
			${(headerIsOpen)
				? ($role === 'admin') ? 'open' : 'closed'
				: 'closed'
			}
			${$isLoggedIn ? '' : 'hidden-during-login'}
		`}
	>
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
				url={urlFromProxiedUrl($moduleState.url)}
			/>
			{:else if $moduleState.activeModule === moduleTypes.CHAT}
			<ChatControls
				roomId={$moduleState.matrixRoomId}
				setHydrogenRoom={setHydrogenRoom}
			/>
			{/if}
		{/if}
	</div>

	<div id="main">
		<div
			id="panel"
			class={`
				${panelIsOpen ? 'open' : 'closed'}
				${$isLoggedIn ? '' : 'hidden-during-login'}
			`}
		>
			<div class="padded">
				{#if $role !== 'admin'}
					<button on:click={claimAdmin}>
						claim admin role
					</button>
				{/if}

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
				<!-- we need the hydrogen iframe to always be there, which
				means we need to hide it rather than unmount it -->
				<Chat
					login={!$isLoggedIn}
					hidden={$moduleState.activeModule !== moduleTypes.CHAT}
				/>

				{#if ($moduleState.activeModule === moduleTypes.PRESENTATION) && $moduleState.url}
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
