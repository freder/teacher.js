<script>
	export let kastaliaId;
	export let startPres;
	export let stopPres;
</script>

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
	→
</button>
<button on:click={() => {
	kastaliaId = undefined;
	stopPres();
}}>
	end presentation
</button>
