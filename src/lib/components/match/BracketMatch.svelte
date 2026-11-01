<script lang="ts">
	import { MatchState, MatchSlot, type ResolvedMatchWithSeeds } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import {
		matchRoster,
		isWinner,
		matchScore,
		matchNote,
		hasMatchScore,
		resolvedMatchToLogical
	} from '$lib/match';
	import MatchInfoRow from './MatchInfoRow.svelte';
	import Note from '../ui/Note.svelte';
	import { resolve } from '$app/paths';
	import { INFO_ROW_HEIGHT, LINE_WIDTH, MATCH_SLOT_HEIGHT } from '$lib/bracket/layout';

	type Props = {
		match: ResolvedMatchWithSeeds;
		seasonSlug: string;
		hoveredRosterId?: string | null;
	};

	let { match, seasonSlug, hoveredRosterId = $bindable(null) }: Props = $props();

	const logicalMatch = $derived(resolvedMatchToLogical(match));
	const showScore = $derived(hasMatchScore(logicalMatch));
</script>

<div
	class="match relative h-(--match-height) w-(--match-width) rounded-lg"
	style="--info-row-height: {INFO_ROW_HEIGHT}px; --line-width: {LINE_WIDTH}px; --slot-height: {MATCH_SLOT_HEIGHT}px;"
>
	<MatchInfoRow
		class="h-(--info-row-height) rounded-t-lg bg-gray-100 px-2 dark:bg-gray-900"
		{match}
	/>

	{@render teamSlot(MatchSlot.A)}

	<div class="h-(--line-width) w-full bg-gray-200 dark:bg-gray-800"></div>

	{@render teamSlot(MatchSlot.B, 'rounded-b-lg')}
</div>

{#snippet teamSlot(slot: MatchSlot, classProp?: string)}
	{@const roster = matchRoster(match, slot)}
	{@const winner = isWinner(logicalMatch, slot)}
	{@const score = matchScore(logicalMatch, slot)}
	{@const note = matchNote(match, slot)}

	<div
		role="button"
		tabindex={0}
		onfocus={() => (hoveredRosterId = roster?.id ?? null)}
		onblur={() => (hoveredRosterId = null)}
		onmouseenter={() => (hoveredRosterId = roster?.id ?? null)}
		onmouseleave={() => (hoveredRosterId = null)}
		class={[
			classProp,
			winner ? 'bg-gray-200 dark:bg-gray-900' : 'bg-gray-100 dark:bg-gray-900/80',
			hoveredRosterId === roster?.id && 'bg-gray-300! dark:bg-gray-800!',
			'relative flex h-(--slot-height) cursor-default items-center pr-4 text-base font-medium text-gray-600 dark:text-gray-400'
		]}
	>
		{#if roster}
			{@const href = resolve(`/lag/${roster.slug}/${seasonSlug}`)}

			<div
				class={[
					'border-gray-300/20 dark:border-gray-700/20',
					'absolute right-0 bottom-0 border-t-28 border-r-28 border-t-transparent!'
				]}
			></div>

			<div class="absolute right-1 bottom-1 z-10 text-xs leading-none font-semibold">
				{roster.seed}
			</div>

			<div
				class={[
					showScore ? 'text-2xl font-extrabold' : 'text-lg',
					winner ? 'text-accent-600 dark:text-accent-500' : 'text-gray-500 dark:text-gray-400',
					'flex h-full w-8 shrink-0 items-center justify-center text-center'
				]}
			>
				{showScore ? score.toString() : '-'}
			</div>

			<RosterLogo id={roster.id} {href} size="sm" class="mr-1" />
			<a
				{href}
				class={[
					winner
						? 'font-semibold text-gray-800 dark:text-gray-200'
						: 'font-medium text-gray-700 dark:text-gray-300',
					'mr-auto truncate hover:underline'
				]}
			>
				{roster.name}
			</a>

			{#if note}
				<Note content={note} class="ml-auto" />
			{/if}
		{:else}
			<div class="grow text-center font-medium">
				{match.state === MatchState.PLAYED ? '---' : 'TBD'}
			</div>
		{/if}
	</div>
{/snippet}
