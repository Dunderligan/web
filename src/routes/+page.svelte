<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import { cdnSrc } from '$lib/util';
	import MatchList from '$lib/components/match/MatchList.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import trailerThumbnail from '$lib/assets/images/trailer-thumbnail.avif';
	import TournamentStateSection from '$lib/components/structure/TournamentStateSection.svelte';
	import Card from '$lib/components/structure/Card.svelte';
	import screenshot1 from '$lib/assets/images/screenshot1.avif';
	import PageSectionAlternate from '$lib/components/structure/PageSectionAlternate.svelte';

	let { data } = $props();
</script>

<Meta />

<header class="relative h-200 w-full px-4">
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

{#if data.tournamentState}
	<TournamentStateSection state={data.tournamentState} />
{/if}

<PageSection topMargin={false}>
	<div class="flex flex-col gap-2 md:flex-row">
		<div>
			<MatchList title="Senaste matcherna" matches={data.matches.latest} hideIfEmpty />
		</div>

		<div class="shrink-0 grow px-2">
			<MatchList title="Kommande matcher" matches={data.matches.upcoming} short />
		</div>
	</div>
</PageSection>

<PageSectionAlternate style="accent">
	<h2 class="font-display text-4xl font-bold">Kolla in vår senaste video!</h2>

	<iframe
		class="mx-auto mt-8 aspect-video w-full max-w-2xl rounded-lg"
		src="https://www.youtube-nocookie.com/embed/lbycWN9xFrA"
		title="YouTube video player"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		allowfullscreen
	></iframe>
</PageSectionAlternate>

<PageSection class="space-y-14" topMargin={false}>
	<Card title="Häng med på Discord!" reverse image={screenshot1} alt="">
		<p>
			Dunderligans Discordserver är turneringens bultande hjärta. Här skickas uppdateringar, matcher
			bokas och de hetaste leaksen sker.
		</p>

		<div class="mt-6 flex items-center">
			<Button kind="primary" icon="ph:discord-logo" label="Discord" href="/discord" />
		</div>
	</Card>

	<Card title="Följ oss på Twitch!" image={screenshot1} alt="">
		<p>
			Dunderligans Discordserver är turneringens bultande hjärta. Här skickas uppdateringar, matcher
			bokas och de hetaste leaksen släpps.
		</p>

		<div class="mt-6 flex items-center justify-end">
			<Button
				kind="primary"
				icon="ph:twitch-logo"
				label="Twitch"
				href="https://twitch.tv/Dunderligan"
			/>
		</div>
	</Card>
</PageSection>

<style>
	h1 {
		line-height: 110%;
	}
</style>
