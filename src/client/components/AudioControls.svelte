<script>
	export let audioState;
	export let startAudio;
	export let stopAudio;
	export let toggleMute;
</script>

<button
	on:click={$audioState.connected ? stopAudio : startAudio}
>
	{$audioState.connected ? 'stop' : 'start'} audio
</button>

<button
	on:click={toggleMute}
	disabled={!$audioState.connected}
>
	{$audioState.muted ? 'unmute' : 'mute'}
</button>
