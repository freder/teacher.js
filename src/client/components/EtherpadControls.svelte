<script>
	export let documentName;
	export let setEtherpadDocument;
</script>

<input
	style="flex: 1; margin-right: var(--padding);"
	type="text"
	inputmode="text"
	placeholder="Etherpad document name"
	bind:value={documentName}
	on:keydown={(event) => {
		if (event.key === 'Enter') {
			setEtherpadDocument(event.target.value);
		}
	}}
>

<button
	on:click={() => setEtherpadDocument(documentName)}
>
	go
</button>
