<script lang="ts">
	import type { TableScore } from '$lib/standings';
	import type { Roster } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import Link from '../ui/Link.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Table from './Table.svelte';
	import { resolve } from '$app/paths';
	import Tooltip from '../ui/Tooltip.svelte';

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
		{ label: '#', snippet: seedCell, center: true, class: 'font-semibold text-lg', width: '3rem' },
		{ label: 'Lag', snippet: teamCell, class: 'font-semibold text-lg' },
		{
			label: 'Poäng',
			content: ({ score }) => score.mapWins,
			center: true,
			tooltip: 'Antal vunna kartor',
			class: 'font-semibold text-xl',
			width: '5rem'
		},
		{
			label: 'W/L/D',
			content: ({ score }) => `${score.mapWins}/${score.mapLosses}/${score.mapDraws}`,
			center: true,
			tooltip: 'Antal vunna/förlorade/oavgjorda kartor',
			class: 'text-lg',
			width: '5rem'
		},
		{
			label: 'Matcher',
			content: ({ score }) => score.matchesPlayed,
			center: true,
			tooltip: 'Antal spelade matcher',
			class: 'text-lg',
			width: '5rem'
		}
	]}
	key={(row) => row.roster.id}
	class="max-w-2xl"
/>

{#snippet line(index: number)}
	{#if index + 1 === playoffLine}
		<div class="absolute -bottom-1 w-full border-b-2 border-dashed border-red-500"></div>
	{/if}
{/snippet}

{#snippet seedCell({ roster }: TableEntry, index: number)}
	{@const isAfterLine = playoffLine && index > playoffLine}
	{@const seed = isAfterLine ? index : index + 1}

	{#if roster.resigned}
		<Tooltip content="Laget fullföljde inte säsongen">
			<Icon icon="ph:minus-circle-fill" class="text-xl text-yellow-600" />
		</Tooltip>
	{:else}
		{seed}
	{/if}
{/snippet}

{#snippet teamCell({ roster }: TableEntry, index: number)}
	{@const href = resolve(`/lag/${roster.slug}/${seasonSlug}`)}

	<RosterLogo id={roster.id} {href} class="mr-2 size-12" />

	<Link {href} class="truncate">{roster.name}</Link>

	{@render line(index)}
{/snippet}
