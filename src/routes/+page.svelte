<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import { cdnSrc } from '$lib/util';
	import MatchList from '$lib/components/match/MatchList.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import trailerThumbnail from '$lib/assets/images/trailer-thumbnail.avif';

	let { data } = $props();
</script>

<Meta />

<header class="relative h-200 w-full px-4 sm:h-180">
	<video
		src={cdnSrc('/dunderligan/trailer.mp4')}
		class="trailer absolute top-0 left-0 -z-10 h-full w-full bg-cover object-cover brightness-50"
		autoplay
		muted
		loop
		playsinline
		preload="metadata"
		poster={trailerThumbnail}
	></video>

	<div class="z-10 mx-auto flex h-full max-w-4xl flex-col justify-center gap-6 pt-8 text-left">
		<h1 class="font-display text-4xl font-extrabold text-white text-shadow-xs sm:text-6xl">
			Sveriges <span class="underline">största</span><br />
			Overwatchturnering
		</h1>
		<p class="font-display text-white text-shadow-xs sm:text-lg">
			Varje år tävlar lag från hela landet i Dunderligan.<br />Alla ranker och erfarenhetsnivåer
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
	<MatchList title="Kommande matcher" matches={data.matches.upcoming} hideIfEmpty />

	<MatchList title="Senaste matcherna" matches={data.matches.latest} hideIfEmpty />
</PageSection>

<style>
	h1 {
		line-height: 110%;
	}
</style>
