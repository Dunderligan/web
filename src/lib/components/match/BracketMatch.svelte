<script lang="ts">
	import { MatchState, type ResolvedMatch, type ResolvedMatchWithSeeds } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import {
		matchRoster,
		isWinner,
		type MatchSide,
		matchScore,
		matchNote,
		hasMatchScore
	} from '$lib/match';
	import MatchInfoRow from './MatchInfoRow.svelte';
	import Note from '../ui/Note.svelte';

	type Props = {
		match: ResolvedMatchWithSeeds;
		seasonSlug: string;
		roundIndex: number;
		hidden?: boolean;
		hasNext: boolean;
		hasPrevAbove: boolean;
		hasPrevBelow: boolean;
	};

	let {
		match,
		seasonSlug,
		roundIndex,
		hidden = false,
		hasNext,
		hasPrevAbove,
		hasPrevBelow
	}: Props = $props();

	// don't ask
	const verticalLineHeight = $derived(40 * Math.pow(roundIndex, 2) - 42 * roundIndex + 82);

	const showScore = $derived(hasMatchScore(match));
</script>

<div
	class={[
		hasNext && 'has-next-round',
		(hasPrevAbove || hasPrevBelow) && 'has-prev-round',
		hidden && 'invisible',
		'relative h-[125px] w-60 rounded-lg'
	]}
>
	<MatchInfoRow class="h-[25px] rounded-t-lg bg-gray-100 px-4 dark:bg-gray-900" {match} />

	{@render side('A')}

	<div class="divider h-0.5 w-full"></div>

	{@render side('B', 'rounded-b-lg')}

	{#if hasPrevAbove}
		<div class="vertical-line line-up" style="height: {verticalLineHeight}px"></div>
	{/if}

	{#if hasPrevBelow}
		<div class="vertical-line line-down" style="height: {verticalLineHeight}px"></div>
	{/if}
</div>

{#snippet side(side: MatchSide, classProp?: string)}
	{@const roster = matchRoster(match, side)}
	{@const won = isWinner(match, side)}
	{@const score = matchScore(match, side)}
	{@const note = matchNote(match, side)}

	{@const href = `/lag/${roster?.slug}/${seasonSlug}`}

	{@const bgClass = showScore
		? won
			? 'bg-gray-200 dark:bg-gray-800'
			: 'bg-gray-50 dark:bg-gray-900'
		: 'bg-gray-100 dark:bg-gray-900'}

	{@const seedBgClass = showScore
		? won
			? 'border-gray-300 dark:border-gray-700'
			: 'border-gray-100 dark:border-gray-800'
		: 'border-gray-200 dark:border-gray-800'}

	<div
		class={[
			classProp,
			bgClass,
			'relative flex h-[49px] items-center overflow-hidden pr-4 font-medium text-gray-600 dark:text-gray-400'
		]}
	>
		{#if roster}
			<div
				class={[
					seedBgClass,
					'absolute right-0 bottom-0 border-t-28 border-r-28 border-t-transparent!'
				]}
			></div>

			<div class="absolute right-1 bottom-1 z-10 text-xs leading-none font-semibold">
				{roster.seed}
			</div>

			<div
				class={[
					showScore ? 'text-2xl font-extrabold' : 'text-lg',
					won ? 'text-accent-600 dark:text-accent-500' : 'text-gray-500 dark:text-gray-400',
					'flex h-full shrink-0 items-center justify-center px-4 text-center'
				]}
			>
				{showScore ? score.toString() : '?'}
			</div>

			<RosterLogo id={roster.id} {href} class="mr-2 size-8" />
			<a
				{href}
				class={[
					won
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
			<div class="grow text-center font-semibold">
				{match.state === MatchState.PLAYED ? '---' : 'TBD'}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	/* Horizontal lines connecting rounds */
	.has-prev-round::before,
	.has-next-round::after {
		content: '';
		position: absolute;
		height: 2px;
		z-index: -1;
	}

	/* Forwards line to next round. */
	.has-next-round::after {
		right: -32px;
		left: 100%;
	}

	/* Backwards line to previous round. */
	.has-prev-round::before {
		right: 100%;
		left: -30px;
	}

	/* Vertical lines connecting to the above and below previous matches. */
	.vertical-line {
		position: absolute;
		left: -30px;
		width: 2px;
		z-index: -1;
	}

	/* Lines that end at the center y of a match */
	.line-down,
	.has-next-round::after,
	.has-prev-round::before {
		top: calc(50% + 25px / 2 - 1px);
	}

	/* Lines that start in the center y of a match */
	.line-up {
		bottom: calc(50% - 25px / 2 - 1px);
	}

	.divider,
	.vertical-line,
	.has-prev-round::before,
	.has-next-round::after {
		background-color: var(--color-gray-200);
	}

	:global(.dark) .divider,
	:global(.dark) .vertical-line,
	:global(.dark) .has-prev-round::before,
	:global(.dark) .has-next-round::after {
		background-color: var(--color-gray-800);
	}
</style>
