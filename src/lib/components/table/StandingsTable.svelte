<script lang="ts">
	import type { TableScore } from '$lib/table';
	import type { Roster } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Table from './Table.svelte';

	type Props = {
		rosters: Roster[];
		scores: { rosterId: string; score: TableScore }[];
		seasonSlug: string;
	};

	let { rosters, scores, seasonSlug }: Props = $props();
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
	rows={scores}
	key={(row) => row.rosterId}
	class="max-w-2xl grid-cols-[40px_1fr_50px_60px_70px] sm:grid-cols-[50px_1fr_80px_60px_80px]"
>
	{#snippet row({ index, value: { rosterId, score } })}
		{@const { id, name, slug } = rosters.find((roster) => roster.id === rosterId)!}

		<div class="group row contents text-lg font-medium">
			<div class="flex items-center justify-center">
				{index + 1}
			</div>

			<div class="flex min-w-0 items-center gap-2 py-2 font-semibold">
				<RosterLogo {id} class="size-12" />

				<a href="/lag/{slug}/{seasonSlug}" class="truncate hover:text-accent-600 hover:underline"
					>{name}</a
				>
			</div>

			<div class="flex items-center justify-center text-xl font-semibold">
				{score.mapWins}
			</div>

			<div class="flex items-center justify-center">
				{score.mapWins}/{score.mapLosses}/{score.mapDraws}
			</div>

			<div class="flex items-center justify-center">
				{score.matchesPlayed}
			</div>
		</div>
	{/snippet}
</Table>

<style>
	.row > div {
		background-color: var(--color-gray-100);
		transition-property: background-color;
	}
</style>
