<script>
	import { hydrogenBaseUrl } from '../../shared/constants';

	export let login;
	export let hidden;

	const loginStyle = `
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
	`;
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
	style={`
		${(login) ? loginStyle : ''}
		${(hidden) ? 'display: none;' : ''}
	`}
/>
