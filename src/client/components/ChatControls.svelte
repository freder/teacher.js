<script>
	import { matrixRoomId } from '../constants';

	export let roomId = matrixRoomId;
	export let setHydrogenRoom;
</script>

<input
	style="flex: 1; margin-right: var(--padding);"
	type="text"
	placeholder="Matrix room id"
	bind:value={roomId}
	on:keydown={(event) => {
		if (event.key === 'Enter') {
			setHydrogenRoom(roomId);
		}
	}}
>

<button
	on:click={() => setHydrogenRoom(roomId)}
>
	go
</button>
