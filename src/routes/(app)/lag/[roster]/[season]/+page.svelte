<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import MembersTable from '$lib/components/table/MembersTable.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Rank from '$lib/components/ui/Rank.svelte';
	import RosterLogo from '$lib/components/ui/RosterLogo.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TeamSocial from '$lib/components/ui/TeamSocial.svelte';
	import {
		averageLegacyRank,
		averageRank,
		cdnImageSrc,
		cdnRosterLogoPath,
		flattenGroup
	} from '$lib/util';
	import { page } from '$app/state';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import MatchList from '$lib/components/match/MatchList.svelte';

	let { data } = $props();

	let { team, roster } = $derived(data);
	let { division, season } = $derived(flattenGroup(roster.group));

	let average = $derived(
		season.legacyRanks ? averageLegacyRank(roster.members) : averageRank(roster.members)
	);

	const upcomingMatches = $derived(roster.matches.filter((match) => !match.played));
	const latestMatches = $derived(roster.matches.filter((match) => match.played));

	const rosterTabItems = $derived(
		team.rosters
			.toSorted((a, b) => {
				const seasonA = flattenGroup(a.group).season;
				const seasonB = flattenGroup(b.group).season;

				return seasonA.name.localeCompare(seasonB.name);
			})
			.map((roster) => {
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
	<meta property="og:image" content={cdnImageSrc(cdnRosterLogoPath(roster.id), { width: 630 })} />
	<meta
		property="og:description"
		content="Se medlemmar och senaste matcher för {roster.name} i {season.name} av Dunderligan."
	/>
</svelte:head>

<PageHeader class="flex flex-col items-center gap-6 sm:flex-row">
	<RosterLogo id={roster.id} class="size-40" imgSize={256} />

	<div>
		<h1 class="mb-1 text-center font-display text-5xl font-extrabold sm:text-left sm:text-6xl">
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
	<section class="shrink grow text-gray-700 dark:text-gray-300">
		<div class="mb-6">
			{#if rosterTabItems.length > 1}
				<Tabs class="grow" items={rosterTabItems} selected={roster.id} />
			{:else}
				<span class="text-lg font-medium">
					Spelar i <a
						href="/stallningar/{season.slug}?div={division.slug}"
						class="font-bold text-accent-600 hover:text-accent-700 hover:underline"
						>{division.name}, {season.name}</a
					>.
				</span>
			{/if}
		</div>

		<MembersTable members={roster.members} />

		<Subheading class="mt-10 mb-4">Senaste matcherna</Subheading>
		<MatchList matches={latestMatches} seasonSlug={season.slug} mainRosterId={roster.id} />

		<Subheading class="mt-10 mb-4">Kommande matcher</Subheading>
		<MatchList matches={upcomingMatches} seasonSlug={season.slug} mainRosterId={roster.id} />

		<Button
			href="/arkiv/matcher?roster={roster.id}&prev={page.url.pathname}"
			label="Se alla matcher"
			icon="ph:arrow-right"
			kind="secondary"
			class="mt-6"
		/>
	</section>

	<section class="flex shrink-0 flex-col gap-5 sm:w-1/4">
		{@render editButton()}

		{#if average}
			<div>
				<div class="font-medium text-gray-700 dark:text-gray-400">Genomsnittlig rank</div>
				<div class="text-xl font-semibold text-gray-800 dark:text-gray-300">
					<Rank rank={average} />
				</div>
			</div>
		{/if}
	</section>
</PageSection>

{#snippet editButton()}
	{#if page.data.user?.isAdmin}
		<Button
			href="/admin/roster/{roster.id}"
			kind="secondary"
			class="max-w-max"
			label="Redigera lag"
			icon="ph:pencil-simple"
		/>
	{/if}
{/snippet}
