<script>
	import { presentationIframeId } from '../constants';

	export let url;
	export let onPresentationLoaded;
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
	id={presentationIframeId}
	src={url}
	on:load={onPresentationLoaded}
></iframe>
