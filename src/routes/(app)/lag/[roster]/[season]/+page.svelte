<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import MembersTable from '$lib/components/table/MembersTable.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Rank from '$lib/components/ui/Rank.svelte';
	import RosterLogo from '$lib/components/ui/RosterLogo.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TeamSocial from '$lib/components/ui/TeamSocial.svelte';
	import { cdnImageSrc, cdnRosterLogoPath, flattenGroup } from '$lib/util';
	import { page } from '$app/state';
	import MatchList from '$lib/components/match/MatchList.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import { MatchState } from '$lib/types';
	import { averageLegacyRank, averageRank } from '$lib/rank';

	let { data } = $props();

	let { team, roster } = $derived(data);
	let { division, season } = $derived(flattenGroup(roster.group));

	let average = $derived(
		season.legacyRanks ? averageLegacyRank(roster.members) : averageRank(roster.members)
	);

	const playedMatches = $derived(
		roster.matches.filter(
			(match) => match.state === MatchState.PLAYED || match.state === MatchState.WALKOVER
		)
	);
	const upcomingMatches = $derived(
		roster.matches.filter(
			(match) => match.state === MatchState.SCHEDULED || match.state === MatchState.CANCELLED
		)
	);

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

<Meta
	title={roster.name}
	description="Se medlemmar och senaste matcher för {roster.name}, {division.name} i {season.name}."
	ogImage={cdnImageSrc(cdnRosterLogoPath(roster.id), { width: 630 })}
	ogImageAlt="Logotyp för {roster.name}"
	ogImageWidth={630}
	ogImageHeight={630}
/>

<PageHeader class="flex flex-col items-center gap-6 sm:flex-row">
	<RosterLogo id={roster.id} class="size-40" imgSize={256} />

	<div>
		<h1 class="mb-1 text-center font-display text-5xl font-extrabold sm:text-left sm:text-6xl">
			{roster.name}
		</h1>
		<div
			class="mt-1 mb-3 text-center text-lg font-semibold text-gray-600 sm:text-left dark:text-gray-400"
		>
			{division.name}, {season.name}
		</div>
	</div>
</PageHeader>

<PageSection class="flex flex-col-reverse gap-10 sm:flex-row">
	<section class="shrink grow text-gray-700 dark:text-gray-300">
		{#if rosterTabItems.length > 1}
			<Tabs class="mb-6 grow" items={rosterTabItems} selected={roster.id} />
		{/if}

		<MembersTable members={roster.members} />

		<MatchList
			title="Kommande matcher"
			matches={upcomingMatches}
			seasonSlug={season.slug}
			mainRosterId={roster.id}
			hideIfEmpty
			hideDivision
		/>

		<MatchList
			title="Spelade matcher"
			matches={playedMatches}
			seasonSlug={season.slug}
			mainRosterId={roster.id}
			hideDivision
		/>
	</section>

	<section class="shrink-0 space-y-6 sm:w-1/4">
		<div class="space-y-2">
			<Button
				href="/stallningar/{season.slug}?div={division.slug}"
				label="Se ställningar"
				icon="ph:table"
				class="max-w-max"
				kind="secondary"
			/>

			{#if page.data.user?.isAdmin}
				<Button
					href="/admin/roster/{roster.id}"
					kind="secondary"
					class="max-w-max"
					label="Redigera lag"
					icon="ph:pencil-simple"
				/>
			{/if}
		</div>

		{#if average}
			<div>
				<div class="font-medium text-gray-700 dark:text-gray-400">Genomsnittlig rank</div>
				<div class="text-xl font-semibold text-gray-800 dark:text-gray-300">
					<Rank rank={average} />
				</div>
			</div>
		{/if}

		{#if team.socials.length > 0}
			<div>
				<div class="font-medium text-gray-700 dark:text-gray-400">Sociala medier</div>

				<div class="mt-1 flex items-center gap-3">
					{#each team.socials as { platform, url } (platform)}
						<TeamSocial class="text-3xl" {platform} href={url} />
					{/each}
				</div>
			</div>
		{/if}
	</section>
</PageSection>
