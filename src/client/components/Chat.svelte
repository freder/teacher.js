<script>
	import { hydrogenBaseUrl } from '../constants';
</script>

<style>
	iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
</style>

<!-- svelte-ignore a11y-missing-attribute -->
<iframe
	id="hydrogen"
	src={hydrogenBaseUrl}
/>
