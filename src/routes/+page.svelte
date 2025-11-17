<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Match from '$lib/components/match/Match.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import type { ResolvedMatch } from '$lib/types';

	let { data } = $props();
</script>

<header class="relative h-[50rem] w-full px-4 sm:h-[45rem]">
	<!-- <div id="color-overlay" class="fixed top-0 bottom-0 left-0 -z-10 w-full"></div> -->
	<!-- <div id="background" class="absolute top-0 bottom-0 left-0 -z-20 w-full"></div> -->

	<video
		src="https://cdn.kesomannen.com/dunderligan/hero.mp4"
		class="absolute top-0 left-0 -z-10 h-full w-full bg-accent-800 object-cover brightness-50"
		autoplay
		muted
		loop
		preload="auto"
	></video>

	<div
		class="mx-auto flex h-full max-w-4xl flex-col justify-center gap-6 pt-8 text-left font-display"
	>
		<h1 class="text-4xl font-extrabold text-white text-shadow-xs sm:text-6xl">
			Sveriges <span class="underline">största</span><br /> återkommande
			<br />Overwatchturnering
		</h1>
		<p class="text-white text-shadow-xs sm:text-lg">
			Varje år tävlar 32 lag från hela landet i Dunderligan.<br />Alla ranker och erfarenhetsnivåer
			välkomnas!
		</p>

		<Button
			icon="ph:arrow-right"
			class="max-w-max shadow-lg"
			label="Se ställningar"
			href="/sasong/test"
		/>
	</div>
</header>

<PageSection topMargin={false} class="space-y-10">
	{@render matchList('Senaste matcher', data.matches.latest)}
	{@render matchList('Kommande matcher', data.matches.upcoming)}
</PageSection>

{#snippet matchList(title: string, matches: Promise<ResolvedMatch[]>)}
	<h2 class="mb-4 font-display text-2xl font-bold text-gray-700">{title}</h2>

	<div class="max-w-2xl space-y-2">
		{#await matches}
			{#each Array.from({ length: 3 })}
				<div class="h-24 animate-pulse rounded-lg bg-gray-100"></div>
			{/each}
		{:then matches}
			{#each matches as match (match.id)}
				<Match seasonSlug={match.rosterA?.seasonSlug ?? match.rosterB?.seasonSlug ?? ''} {match} />
			{/each}
		{/await}
	</div>
{/snippet}

<style>
	#color-overlay {
		mix-blend-mode: color;
		background-image: linear-gradient(to bottom, var(--color-accent-900), var(--color-accent-600));
		filter: saturate(75%);
	}

	#background {
		background-image: url('/hero.png');
		filter: contrast(110%) brightness(50%);
		background-size: cover;
	}

	h1 {
		line-height: 110%;
	}
</style>
