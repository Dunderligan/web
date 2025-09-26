<script lang="ts">
	import type { Roster } from '$lib/types';
	import type { TableScore } from '$lib/util';
	import RosterLogo from './RosterLogo.svelte';
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
	class="max-w-2xl grid-cols-[50px_1fr_80px_60px_80px]"
>
	{#snippet row({ index, value: { rosterId, score } })}
		{@const { id, name, slug } = rosters.find((roster) => roster.id === rosterId)!}

		<div class="flex items-center justify-center bg-gray-200 text-lg font-semibold">
			{index + 1}
		</div>

		<div class="flex min-w-0 items-center gap-2 bg-gray-200 py-2 text-lg font-semibold">
			<RosterLogo {id} />

			<a href="/lag/{seasonSlug}/{slug}" class="truncate hover:text-accent-600 hover:underline"
				>{name}</a
			>
		</div>

		<div class="flex items-center justify-center bg-gray-200 text-lg font-semibold">
			{score.mapWins}
		</div>

		<div class="flex items-center justify-center bg-gray-200 text-lg font-medium">
			{score.mapWins}/{score.mapLosses}/{score.mapDraws}
		</div>

		<div class="flex items-center justify-center bg-gray-200 text-lg font-medium">
			{score.matchesPlayed}
		</div>
	{/snippet}
</Table>
