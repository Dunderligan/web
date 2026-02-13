<script lang="ts">
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Rank from '$lib/components/ui/Rank.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import { flattenGroup, roleIcon } from '$lib/util';

	let { data } = $props();

	const sortedMemberships = $derived(
		data.player.memberships.toSorted((a, b) => {
			const aSeason = flattenGroup(a.roster.group).season;
			const bSeason = flattenGroup(b.roster.group).season;

			return bSeason.startedAt.getTime() - aSeason.startedAt.getTime();
		})
	);

	const lastMembership = $derived(sortedMemberships.at(0));
</script>

<PageHeader title={data.player.battletag}></PageHeader>

<PageSection>
	{#if lastMembership}
		{@const roster = lastMembership.roster}
		{@const { season } = flattenGroup(roster.group)}

		<div>
			Spelade senast i <a href="/lag/{roster.slug}/{season.slug}">
				{roster.name}, {season.name}
			</a>
		</div>
	{/if}

	<Subheading>Rosters</Subheading>

	<div>
		{#each sortedMemberships as membership (membership.roster.id)}
			{@const { roster, role, rank, tier, sr } = membership}
			{@const { division, season } = flattenGroup(roster.group)}

			<div>
				<div>
					{roster.name}
				</div>

				<div>
					{division.name}, {season.name}
				</div>

				<div>
					<Icon icon={roleIcon(role)} />

					{#if season.legacyRanks}
						{#if sr}
							<Rank rank={{ sr }} />
						{/if}
					{:else if tier && rank}
						<Rank rank={{ tier, rank }} />
					{/if}
				</div>
			</div>
		{/each}
	</div>
</PageSection>
