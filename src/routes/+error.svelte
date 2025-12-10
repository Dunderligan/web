<script lang="ts">
	import { page } from '$app/state';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<div id="background" class="fixed top-0 min-h-140 w-full min-w-lg"></div>

<div class="relative flex min-h-screen flex-col overflow-hidden">
	<div
		class="pointer-events-none fixed top-32 left-200 size-400 rounded-full bg-accent-400/20"
		id="splotch" 
	></div>

	<div class="mb-12 h-18"></div>

	<PageSection topMargin={false} class="text-center">
		<h2 class="mt-4 text-lg font-medium text-gray-700">Något gick fel:</h2>
		<h1 class="mt-2 text-center text-8xl font-bold text-gray-900">{page.status}</h1>
		<h1 class="text-center text-3xl font-semibold text-gray-800">{page.error?.message}</h1>

		{#if page.status === 404}
			<Button
				kind="primary"
				href="/"
				class="mx-auto mt-12"
				icon="ph:arrow-left"
				label="Gå till startsidan"
			/>
		{/if}
	</PageSection>
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
