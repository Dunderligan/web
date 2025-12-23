<script lang="ts">
	import type { TableScore } from '$lib/table';
	import type { Roster } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Table from './Table.svelte';

	type TableEntry = {
		roster: Roster;
		score: TableScore;
	};

	type Row = TableEntry | 'playoffLine';

	type Props = {
		standings: TableEntry[];
		playoffLine: number | null;
		seasonSlug: string;
	};

	let { standings, playoffLine, seasonSlug }: Props = $props();

	const rows = $derived.by(() => {
		if (!playoffLine) return standings;

		const rowsWithLine: Row[] = [];
		standings.forEach((entry, index) => {
			rowsWithLine.push(entry);
			if (index === playoffLine! - 1) {
				rowsWithLine.push('playoffLine');
			}
		});

		return rowsWithLine;
	});
</script>

<Table
	columns={[
		{
			label: '#',
			center: true,
			title: 'Seed'
		},
		{
			label: 'Lag'
		},
		{ label: 'Poäng', center: true, title: 'Antal vunna maps' },
		{ label: 'W/L/D', center: true, title: 'Wins/Losses/Draws' },
		{ label: 'Matcher', center: true, title: 'Spelade matcher' }
	]}
	{rows}
	key={(row) => (row === 'playoffLine' ? row : row.roster.id)}
	class="max-w-2xl grid-cols-[40px_1fr_50px_60px_70px] sm:grid-cols-[50px_1fr_80px_60px_80px]"
>
	{#snippet row({ index, value: row })}
		{#if row === 'playoffLine'}
			<div class="my-2.5 border-t-2 border-dashed border-red-600"></div>
			<div class="my-2.5 border-t-2 border-dashed border-red-600"></div>
			<div class="my-auto bg-transparent text-center text-sm font-semibold text-red-600">
				Playoffs
			</div>
			<div class="my-2.5 border-t-2 border-dashed border-red-600"></div>
			<div class="my-2.5 border-t-2 border-dashed border-red-600"></div>
		{:else}
			{@const { roster, score } = row}

			{@const isAfterLine = playoffLine && index > playoffLine}
			{@const seed = isAfterLine ? index : index + 1}

			<div class="relative flex items-center justify-center text-lg font-semibold">
				{seed}
			</div>

			<div class="flex min-w-0 items-center gap-2 py-2 text-lg font-semibold">
				<RosterLogo id={roster.id} class="size-12" />

				<a href="/lag/{roster.slug}/{seasonSlug}" class="truncate hover:underline">{roster.name}</a>
			</div>

			<div class="flex items-center justify-center text-xl font-semibold">
				{score.mapWins}
			</div>

			<div class="flex items-center justify-center text-lg font-medium">
				{score.mapWins}/{score.mapLosses}/{score.mapDraws}
			</div>

			<div class="flex items-center justify-center text-lg font-medium">
				{score.matchesPlayed}
			</div>
		{/if}
	{/snippet}
</Table>
