<script>
	import { derived } from 'svelte/store';

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

	export let userState;
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

	const role = derived(
		roomState,
		($roomState) => ($roomState.adminIds.includes($userState.socketId))
			? 'admin'
			: 'user'
	);

	// TODO: needed?
	let kastaliaId;
	let headerIsOpen = true;
	let panelIsOpen = true;

	const isLoggedIn = derived(
		userState,
		($userState) => Boolean($userState.matrixUserId)
	);

	const activeModule = derived(
		moduleState,
		($moduleState) => {
			return ($isLoggedIn)
				? $moduleState.activeModule
				: moduleTypes.CHAT;
		}
	)

	const wikiJumpToSection = (hash) => {
		const proxiedUrl = $moduleState.wikipediaState.url;
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
		display: flex;
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
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	#panel {
		border-right: solid 2px black;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
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
		top: ${headerIsOpen
			? $role === 'admin'
				? '56px'
				: 'var(--padding)'
			: 'var(--padding)'
		};
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
			<!-- "TABS" -->
			<!-- svelte-ignore a11y-no-onchange -->
			<select
				style="flex: 0; margin-right: var(--padding);"
				value={$activeModule}
				on:change={(event) => {
					setActiveModule(event.target.value);
				}}
			>
				<optgroup label="Select module">
					<option value={moduleTypes.PRESENTATION}>
						Presentation
					</option>
					<option value={moduleTypes.WIKIPEDIA}>
						Wikipedia
					</option>
					<option value={moduleTypes.CHAT}>
						Chat
					</option>
				</optgroup>
			</select>

			<!-- CONTEXTUAL OPTIONS -->
			{#if $activeModule === moduleTypes.PRESENTATION}
			<PresentationControls
				kastaliaId={kastaliaId}
				startPres={startPres}
				stopPres={stopPres}
			/>
			{:else if $activeModule === moduleTypes.WIKIPEDIA}
			<WikipediaControls
				setWikiUrl={setWikiUrl}
				wikiJumpToSection={wikiJumpToSection}
				activeSectionHash={$moduleState.wikipediaState.activeSectionHash}
				url={urlFromProxiedUrl($moduleState.wikipediaState.url)}
			/>
			{:else if $activeModule === moduleTypes.CHAT}
			<ChatControls
				roomId={$moduleState.chatState.matrixRoomId}
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
			<div style="flex-grow: 0; flex-shrink: 0;">
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
			</div>

			<div class="padded" style="flex-grow: 1; overflow-y: auto;">
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
					hidden={$activeModule !== moduleTypes.CHAT}
				/>

				{#if ($activeModule === moduleTypes.PRESENTATION) && $moduleState.presentationState.url}
					<Presentation
						url={$moduleState.presentationState.url}
						onPresentationLoaded={onPresentationLoaded}
					/>
				{:else if ($activeModule === moduleTypes.WIKIPEDIA) && $moduleState.wikipediaState.url}
					<Wikipedia url={$moduleState.wikipediaState.url} />
				{/if}
			</div>
		</div>
	</div>
</div>
