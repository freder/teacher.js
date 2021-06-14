<script>
	export let kastaliaId;
	export let startPres;
	// export let stopPres;
</script>

<input
	style="flex: 1; margin-right: var(--padding);"
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
<button
	on:click={() => startPres(kastaliaId)}
>
	go
</button>
<!-- <button on:click={() => {
	kastaliaId = undefined;
	stopPres();
}}>
	end
</button> -->
