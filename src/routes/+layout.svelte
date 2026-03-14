<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/images/favicon.ico';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import Footer from '$lib/components/structure/Footer.svelte';
	import Navbar from '$lib/components/structure/Navbar.svelte';
	import { page } from '$app/state';
	import { PreferencesState } from '$lib/state/preferences.svelte';

	let { children, data } = $props();

	// svelte-ignore state_referenced_locally
	PreferencesState.set(new PreferencesState(data.preferences));

	const prefs = PreferencesState.get();

	const isLandingPage = $derived(page.url.pathname === '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class={[prefs.theme === 'dark' && 'dark']}>
	<ProgressBar class="text-accent-500" zIndex={100} />

	<Navbar alwaysWhiteTextAtTop={isLandingPage} />

	{@render children()}

	<Footer />
</div>
