<script lang="ts">
	import { RosterContext } from '$lib/state/rosters.svelte';
	import type { UnresolvedMatch } from '$lib/types';
	import { formatDate } from '$lib/util';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		match: UnresolvedMatch;
		canEditRosters?: boolean;
		canDelete?: boolean;
		ondelete?: () => void;
	};

	let { match, canEditRosters = true, canDelete = true, ondelete }: Props = $props();

	const rosterCtx = RosterContext.get();

	const date = $derived(match.played ? match.playedAt : match.scheduledAt);
</script>

<div class="relative rounded-lg bg-gray-100 px-1 py-1 dark:bg-gray-900">
	<div class="px-4 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
		<Icon icon={match.played ? 'ph:check-circle' : 'ph:calendar-blank'} />
		<span>{match.played ? 'Spelad' : 'Planerad'}</span>

		{#if date}
			{formatDate(date)}
		{:else}
			<span>(inget datum)</span>
		{/if}
	</div>

	{@render side(match.teamAScore, match.rosterAId, match.teamANote)}
	{@render side(match.teamBScore, match.rosterBId, match.teamBNote)}

	<div class="absolute top-3 right-3 flex items-center">
		<Button
			icon="ph:pencil-simple"
			kind="tertiary"
			onclick={() => rosterCtx.editMatch(match, canEditRosters)}
			title="Redigera"
		/>

		{#if canDelete}
			<Button icon="ph:trash" kind="tertiary" onclick={ondelete} title="Radera" />
		{/if}
	</div>
</div>

{#snippet side(score: number, rosterId?: string | null, note?: string | null)}
	{@const roster = rosterCtx.find(rosterId)}

	<div class="flex items-center py-0.5 text-gray-700 dark:text-gray-300">
		<div class="flex w-8 items-center justify-center text-xl font-bold">
			{match.played ? score.toString() : '-'}
		</div>

		{#if roster}
			<a href="/admin/roster/{rosterId}" class="font-semibold hover:underline">{roster?.name}</a>
		{:else}
			---
		{/if}

		{#if note}
			<Icon icon="ph:info" class="ml-2" />
		{/if}
	</div>
{/snippet}
