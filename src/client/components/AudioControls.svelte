<script>
	export let audioState;
	export let startAudio;
	export let stopAudio;
	export let toggleMute;
</script>

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
