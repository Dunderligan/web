<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/images/favicon.png';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import Footer from '$lib/components/structure/Footer.svelte';
	import Navbar from '$lib/components/structure/Navbar.svelte';
	import { page } from '$app/state';
	import { ThemeState } from '$lib/state/theme.svelte';
	import { Tooltip } from 'bits-ui';

	let { children, data } = $props();

	// svelte-ignore state_referenced_locally
	ThemeState.set(new ThemeState(data.theme));

	const theme = ThemeState.get();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class={[theme.current === 'dark' && 'dark']}>
	<ProgressBar class="text-accent-500" zIndex={100} />

	<Navbar dark={page.url.pathname === '/'} />

	{@render children()}

	<Footer />
</div>
