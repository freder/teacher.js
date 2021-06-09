<script>
	import { matrixRoomId } from '../constants';

	export let roomId = matrixRoomId;
	export let setHydrogenRoom;
</script>

<input
	type="text"
	placeholder="Matrix room id"
	bind:value={roomId}
	on:keydown={(event) => {
		if (event.key === 'Enter') {
			setHydrogenRoom(roomId);
		}
	}}
>
