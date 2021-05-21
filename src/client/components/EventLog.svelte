<script>
	export let log;
</script>

<style>
	.log {
		font-family: monospace;
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}
</style>

<div class="log">
	{#each log as entry}
		<div>{entry}</div>
	{/each}
</div>
