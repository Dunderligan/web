<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ProgressBar class="text-accent-500" zIndex={100} />

<div id="background" class="fixed top-0 min-h-[35rem] w-full min-w-lg"></div>

<div class="relative flex min-h-screen flex-col overflow-hidden">
	<div
		class="fixed top-32 left-[-50rem] size-[100rem] rounded-full bg-accent-400/20"
		id="splotch"
	></div>

	<Navbar />

	<div class="mb-8 h-18"></div>

	{@render children?.()}

	<Footer />
</div>

<style>
	#background {
		background-image:
			linear-gradient(to bottom, transparent, var(--color-gray-100) 100%), url('/striped-bg.png');
		background-size: cover;
		aspect-ratio: 16 / 9;
	}

	#splotch {
		filter: blur(1000px);
	}
</style>
