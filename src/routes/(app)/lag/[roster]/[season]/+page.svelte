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
	import { averageRank, cdnImageSrc, sortRole as compareRole, flattenGroup } from '$lib/util';
	import { page } from '$app/state';

	let { data } = $props();

	let { team, roster } = $derived(data);
	let { group, division, season } = $derived(flattenGroup(roster.group));

	let sortedMembers = $derived(roster.members.toSorted((a, b) => compareRole(a.role, b.role)));
	let average = $derived(averageRank(roster.members));

	const rosterTabItems = $derived(
		team.rosters.map((roster) => {
			const { season } = flattenGroup(roster.group);

			return {
				label: `${season.name}`,
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
		content="Laget {roster.name} spelar i {group.name}, {division.name} i {season.name} av Dunderligan, Sveriges främsta Overwatchliga.
		{roster.name} har {roster.members.length} medlemmar: {sortedMembers
			.map((member) => member.player.battletag)
			.join(', ')}, med den genomsnittliga ranken {average.rank} {average.tier}. Laget har {team
			.socials.length} sociala medier länkade: {team.socials
			.map((social) => `${social.platform} (${social.url})`)
			.join(', ')}."
	/>

	<meta property="og:title" content={roster.name} />
	<meta
		property="og:description"
		content="Laget {roster.name} i {division.name} av Dunderligan, {season.name}."
	/>
	<meta property="og:image" content={cdnImageSrc(`/logos/${roster.id}.png`, { width: 630 })} />
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
			<div class="mb-4 text-lg font-medium text-gray-700">
				Spelar i <a
					href="/sasong/{season.slug}?div={division.slug}"
					class="font-bold text-accent-600 hover:text-accent-700 hover:underline"
					>{season.name}, {division.name}</a
				>.
			</div>
		{/if}

		<MembersTable members={sortedMembers} />

		<h2 class="mt-8 mb-4 font-display text-2xl font-bold text-gray-700">Senaste matcher</h2>

		<div class="space-y-2">
			{#each roster.matches as match (match.id)}
				<Match seasonSlug={season.slug} {match} />
			{/each}
		</div>
	</section>

	<section class="shrink-0 sm:w-1/4">
		{@render editButton('mb-4')}

		<div>
			{#if average}
				<div class="font-medium text-gray-700">Genomsnittlig rank</div>
				<div class="text-xl font-semibold text-gray-800">
					<Rank {...average} />
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
