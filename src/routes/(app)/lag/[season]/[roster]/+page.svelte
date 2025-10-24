<script lang="ts">
	import { authClient, isAdmin } from '$lib/auth-client';
	import Button from '$lib/components/Button.svelte';
	import Match from '$lib/components/Match.svelte';
	import MembersTable from '$lib/components/MembersTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageSection from '$lib/components/PageSection.svelte';
	import Rank from '$lib/components/Rank.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import Tabs from '$lib/components/Tabs.svelte';
	import TeamSocial from '$lib/components/TeamSocial.svelte';
	import type { ClassValue } from '$lib/types';
	import { averageRank, sortRole as compareRole, flattenGroup } from '$lib/util';

	const session = authClient.useSession();

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
				href: `/lag/${season.slug}/${roster.slug}`
			};
		})
	);
</script>

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

				<Tabs class="grow" items={rosterTabItems} />
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
	{#if isAdmin($session.data?.user)}
		<Button
			href="/admin/roster/{roster.id}"
			kind="secondary"
			class={[classProp, 'w-max']}
			label="Redigera lag"
			icon="mdi:pencil"
		/>
	{/if}
{/snippet}
