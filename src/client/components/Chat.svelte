<script>
	import { hydrogenBaseUrl } from '../constants';

	export let login;
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
	style={(login)
		? `
			position: fixed;
			top: 0;
			left: 0;
			z-index: 9999;
		`
		: ''
	}
/>
