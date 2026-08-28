<script lang="ts">
	import type { TableScore } from '$lib/standings';
	import type { Roster } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import Link from '../ui/Link.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Table from './Table.svelte';

	type TableEntry = {
		roster: Roster;
		score: TableScore;
	};

	type Props = {
		standings: TableEntry[];
		playoffLine: number | null;
		seasonSlug: string;
	};

	let { standings, playoffLine, seasonSlug }: Props = $props();
</script>

<Table
	rows={standings}
	columns={[
		{
			label: '#',
			center: true,
			width: 'min-content'
		},
		{
			label: 'Lag',
			width: '1fr'
		},
		{ label: 'Poäng', center: true, note: 'Antal vunna maps' },
		{ label: 'W/L/D', center: true, note: 'Map record: Wins/Losses/Draws' },
		{ label: 'Matcher', center: true }
	]}
	key={(row) => row.roster.id}
	class="max-w-2xl"
>
	{#snippet row({ index, value: row })}
		{@const { roster, score } = row}

		{@const isAfterLine = playoffLine && index > playoffLine}
		{@const seed = isAfterLine ? index : index + 1}

		{@const href = `/lag/${roster.slug}/${seasonSlug}`}

		<div class="relative justify-center text-lg font-semibold">
			{#if roster.resigned}
				<Icon
					icon="ph:minus-circle-fill"
					title="Laget fullföljde inte säsongen"
					class="text-xl text-yellow-600"
				/>
			{:else}
				{seed}
			{/if}

			{@render line(index)}
		</div>

		<div class="relative gap-2 text-lg font-semibold">
			<RosterLogo id={roster.id} {href} class="size-12" />

			<Link {href} class="truncate">{roster.name}</Link>

			{@render line(index)}
		</div>

		<div class="relative justify-center text-xl font-semibold">
			{score.mapWins}

			{@render line(index)}
		</div>

		<div class="relative justify-center text-lg">
			{score.mapWins}/{score.mapLosses}/{score.mapDraws}

			{@render line(index)}
		</div>

		<div class="relative justify-center text-lg">
			{score.matchesPlayed}

			{@render line(index)}
		</div>
	{/snippet}
</Table>

{#snippet line(index: number)}
	{#if index + 1 === playoffLine}
		<div class="absolute -bottom-1 w-full border-b-2 border-dashed border-red-500"></div>
	{/if}
{/snippet}
