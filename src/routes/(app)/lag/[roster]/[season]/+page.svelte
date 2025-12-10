<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Match from '$lib/components/match/Match.svelte';
	import MembersTable from '$lib/components/table/MembersTable.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Rank from '$lib/components/ui/Rank.svelte';
	import RosterLogo from '$lib/components/ui/RosterLogo.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TeamSocial from '$lib/components/ui/TeamSocial.svelte';
	import type { ClassValue } from '$lib/types';
	import { averageLegacyRank, averageRank, cdnImageSrc, flattenGroup } from '$lib/util';
	import { page } from '$app/state';
	import Subheading from '$lib/components/ui/Subheading.svelte';

	let { data } = $props();

	let { team, roster } = $derived(data);
	let { division, season } = $derived(flattenGroup(roster.group));

	let average = $derived(
		season.legacyRanks ? averageLegacyRank(roster.members) : averageRank(roster.members)
	);

	const upcomingMatches = $derived(roster.matches.filter((match) => !match.played));
	const latestMatches = $derived(roster.matches.filter((match) => match.played));

	const rosterTabItems = $derived(
		team.rosters.map((roster) => {
			const { season } = flattenGroup(roster.group);

			return {
				label: season.name,
				value: roster.id,
				href: `/lag/${roster.slug}/${season.slug}`
			};
		})
	);
</script>

<svelte:head>
	<title>{roster.name} - {season.name} | Dunderligan</title>
	<meta
		name="description"
		content="Se medlemmar och senaste matcher för {roster.name} i {season.name} av Dunderligan."
	/>

	<meta property="og:title" content={roster.name} />
	<meta property="og:image" content={cdnImageSrc(`/logos/${roster.id}.png`, { width: 630 })} />
	<meta
		property="og:description"
		content="Se medlemmar och senaste matcher för {roster.name} i {season.name} av Dunderligan."
	/>
</svelte:head>

<PageHeader class="flex flex-col items-center gap-6 sm:flex-row">
	<RosterLogo id={roster.id} class="size-40" imgSize={256} />

	<div>
		<h1
			class="mb-1 text-center font-display text-5xl font-extrabold text-black sm:text-left sm:text-6xl"
		>
			{roster.name}
		</h1>
		<div class="flex items-center justify-center gap-3 sm:justify-start">
			{#each team.socials as { platform, url } (platform)}
				<TeamSocial class="text-4xl" {platform} href={url} />
			{/each}
		</div>
	</div>
</PageHeader>

<PageSection class="flex flex-col-reverse gap-10 sm:flex-row">
	<section class="shrink grow">
		{#if rosterTabItems.length > 1}
			<div class="mb-6 flex items-center gap-6">
				<h3 class="text-xl font-semibold text-gray-700">Rosters</h3>

				<Tabs class="grow" items={rosterTabItems} selected={roster.id} />
			</div>
		{:else}
			<div class="mb-6 text-lg font-medium text-gray-700">
				Spelar i <a
					href="/stallningar/{season.slug}?div={division.slug}"
					class="font-bold text-accent-600 hover:text-accent-700 hover:underline"
					>{division.name}, {season.name}</a
				>.
			</div>
		{/if}

		<MembersTable members={roster.members} />

		{#if latestMatches.length > 0}
			<Subheading class="mt-10 mb-4">Senaste matcher</Subheading>

			<div class="space-y-2">
				{#each latestMatches as match (match.id)}
					<Match seasonSlug={season.slug} {match} flipped={match.rosterB?.id === roster.id} />
				{/each}
			</div>
		{/if}

		{#if upcomingMatches.length > 0}
			<Subheading class="mt-10 mb-4">Kommande matcher</Subheading>

			<div class="space-y-2">
				{#each upcomingMatches as match (match.id)}
					<Match seasonSlug={season.slug} {match} flipped={match.rosterB?.id === roster.id} />
				{/each}
			</div>
		{/if}

		<Button
			href="/arkiv/matcher?roster={roster.id}&prev={page.url.pathname}"
			label="Se alla matcher"
			icon="ph:arrow-right"
			kind="secondary"
			class="mt-6"
		/>
	</section>

	<section class="shrink-0 sm:w-1/4">
		{@render editButton('mb-4')}

		<div>
			{#if average}
				<div class="font-medium text-gray-700">Genomsnittlig rank</div>
				<div class="text-xl font-semibold text-gray-800">
					<Rank rank={average} />
				</div>
			{/if}
		</div>
	</section>
</PageSection>

{#snippet editButton(classProp: ClassValue)}
	{#if page.data.user?.isAdmin}
		<Button
			href="/admin/roster/{roster.id}"
			kind="secondary"
			class={[classProp, 'w-max']}
			label="Redigera lag"
			icon="ph:pencil-simple"
		/>
	{/if}
{/snippet}
