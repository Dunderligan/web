<script lang="ts">
	import type { TableScore } from '$lib/table';
	import type { Roster } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Table from './Table.svelte';

	type TableEntry = {
		rosterId: string;
		score: TableScore;
	};

	type Row = TableEntry | 'playoffLine';

	type Division = {
		rosters: Roster[];
		table: TableEntry[];
		playoffLine: number | null;
	};

	type Props = {
		division: Division;
		seasonSlug: string;
	};

	let { division, seasonSlug }: Props = $props();

	const rows = $derived.by(() => {
		if (!division.playoffLine) return division.table;

		const rowsWithLine: Row[] = [];
		division.table.forEach((entry, index) => {
			rowsWithLine.push(entry);
			if (index === division.playoffLine! - 1) {
				rowsWithLine.push('playoffLine');
			}
		});

		return rowsWithLine;
	});
</script>

<Table
	columns={[
		'#',
		{
			label: 'Lag',
			center: false
		},
		'Poäng',
		'W/L/D',
		'Matcher'
	]}
	{rows}
	key={(row) => (row === 'playoffLine' ? row : row.rosterId)}
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
			{@const { rosterId, score } = row}
			{@const { id, name, slug } = division.rosters.find((roster) => roster.id === rosterId)!}

			{@const isAfterLine = division.playoffLine && index > division.playoffLine}
			{@const seed = isAfterLine ? index : index + 1}

			<div class="relative flex items-center justify-center text-lg font-semibold">
				{seed}
			</div>

			<div class="flex min-w-0 items-center gap-2 py-2 text-lg font-semibold">
				<RosterLogo {id} class="size-12" />

				<a href="/lag/{slug}/{seasonSlug}" class="truncate hover:underline">{name}</a>
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
