<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import { cdnSrc } from '$lib/util';
	import MatchList from '$lib/components/match/MatchList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dunderligan</title>
	<meta
		name="description"
		content="Välkommen till Dunderligan, Sveriges största återkommande Overwatchturnering!"
	/>

	<meta property="og:title" content="Dunderligan" />
	<meta
		property="og:description"
		content="Välkommen till Dunderligan, Sveriges största återkommande Overwatchturnering!"
	/>
</svelte:head>

<header class="relative h-200 w-full px-4 sm:h-180">
	<video
		src={cdnSrc('/dunderligan/trailer.mp4')}
		class="trailer absolute top-0 left-0 -z-10 h-full w-full bg-cover object-cover brightness-50"
		autoplay
		muted
		loop
		playsinline
		preload="auto"
	></video>

	<div class="z-10 mx-auto flex h-full max-w-4xl flex-col justify-center gap-6 pt-8 text-left">
		<h1 class="font-display text-4xl font-extrabold text-white text-shadow-xs sm:text-6xl">
			Sveriges <span class="underline">största</span><br /> återkommande
			<br />Overwatchturnering
		</h1>
		<p class="font-display text-white text-shadow-xs sm:text-lg">
			Varje år tävlar 36 lag från hela landet i Dunderligan.<br />Alla ranker och erfarenhetsnivåer
			välkomnas!
		</p>

		<Button
			icon="ph:arrow-right"
			class="max-w-max shadow-lg"
			label="Se ställningar"
			href="/stallningar"
		/>
	</div>
</header>

<PageSection topMargin={false}>
	<MatchList title="Senaste matcherna" matches={data.matches.latest} hideIfEmpty />

	<MatchList title="Kommande matcher" matches={data.matches.upcoming} hideIfEmpty />
</PageSection>

<style>
	h1 {
		line-height: 110%;
	}

	.trailer {
		background-image: url('/trailer-thumbnail.avif'), linear-gradient(var(--color-accent-600));
	}
</style>
