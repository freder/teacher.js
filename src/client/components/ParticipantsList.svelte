<script>
	export let userState;
	export let roomState;
</script>

<style>
	.participants {
		margin: 0;
		padding: 0;
		padding-left: 1em;
	}
</style>

<ul class="participants">
	{#each roomState.users as user}
		<li>
			<span
				style={(user.socketId === userState.socketId)
					? 'background: black; color: white;'
					: ''
				}
			>
				{user.name}
			</span>
			{#if roomState.adminIds.includes(user.socketId)}
				{' (admin)'}
			{/if}
		</li>
	{/each}
</ul>
