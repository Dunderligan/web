<script lang="ts">
	import { MatchState, type ResolvedMatchWithSeeds } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import {
		matchRoster,
		isWinner,
		type MatchSide,
		matchScore,
		matchNote,
		hasMatchScore,
		resolvedMatchToLogical
	} from '$lib/match';
	import MatchInfoRow from './MatchInfoRow.svelte';
	import Note from '../ui/Note.svelte';
	import { resolve } from '$app/paths';

	type State = 'visible' | 'invisible' | 'hidden';

	type Lines = {
		forward?: boolean;
		backward?: boolean;
		up?: boolean;
		down?: boolean;
	};

	type Props = {
		match: ResolvedMatchWithSeeds;
		seasonSlug: string;
		state: State;
		lines: Lines;
		hoveredRosterId?: string | null;
	};

	let { match, seasonSlug, state, lines, hoveredRosterId = $bindable(null) }: Props = $props();

	const logicalMatch = $derived(resolvedMatchToLogical(match));
	const showScore = $derived(hasMatchScore(logicalMatch));
</script>

<div
	class={[
		lines.forward && 'has-next-round',
		lines.backward && 'has-prev-round',
		state === 'hidden' ? 'hidden' : state === 'invisible' ? 'invisible' : 'visible',

		'match relative h-(--match-height) w-(--match-width) rounded-lg'
	]}
>
	<MatchInfoRow
		class="h-(--info-row-height) rounded-t-lg bg-gray-100 px-2 dark:bg-gray-900"
		{match}
	/>

	{@render side('A')}

	<div class="h-(--line-width) w-full bg-gray-200 dark:bg-gray-800"></div>

	{@render side('B', 'rounded-b-lg')}

	{#if lines.up}
		<div class="vertical-line line-up"></div>
	{/if}

	{#if lines.down}
		<div class="vertical-line line-down"></div>
	{/if}
</div>

{#snippet side(side: MatchSide, classProp?: string)}
	{@const roster = matchRoster(match, side)}
	{@const won = isWinner(logicalMatch, side)}
	{@const score = matchScore(logicalMatch, side)}
	{@const note = matchNote(match, side)}

	{@const bgClass = showScore
		? won
			? 'bg-gray-200 dark:bg-gray-900'
			: 'bg-gray-100 dark:bg-gray-900/80'
		: 'bg-gray-100 dark:bg-gray-900/80'}

	<div
		role="button"
		tabindex={0}
		onmouseenter={() => (hoveredRosterId = roster?.id ?? null)}
		onmouseleave={() => (hoveredRosterId = null)}
		class={[
			classProp,
			bgClass,
			hoveredRosterId === roster?.id && 'bg-gray-300! dark:bg-gray-800!',
			'relative flex h-(--side-height) cursor-default items-center pr-4 text-base font-medium text-gray-600 dark:text-gray-400'
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
					won ? 'text-accent-600 dark:text-accent-500' : 'text-gray-500 dark:text-gray-400',
					'flex h-full w-8 shrink-0 items-center justify-center text-center'
				]}
			>
				{showScore ? score.toString() : '-'}
			</div>

			<RosterLogo id={roster.id} {href} class="mr-1 size-8" />
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
			<div class="grow text-center font-medium">
				{match.state === MatchState.PLAYED ? '---' : 'TBD'}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	.match {
		--match-height: 120px;
		--match-width: 225px;
		--line-width: 2px;
		--info-row-height: 20px;

		--side-height: calc((var(--match-height) - var(--info-row-height) - var(--line-width)) / 2);

		--prev-match-count: calc(pow(2, var(--bracket-round-index) - 1));
		--prev-matches-height: calc(
			(var(--prev-match-count) * (var(--match-height) + var(--bracket-match-spacing)))
		);
	}

	/* Horizontal lines connecting rounds */
	.has-prev-round::before,
	.has-next-round::after {
		content: '';
		position: absolute;
		height: var(--line-width);
		z-index: -1;
	}

	/* Forwards line to next round. */
	.has-next-round::after {
		right: calc(var(--bracket-round-spacing) / -2);
		left: 100%;
	}

	/* Backwards line to previous round. */
	.has-prev-round::before {
		right: 100%;
		left: calc(var(--bracket-round-spacing) / -2);
	}

	/* Vertical lines connecting to the above and below previous matches. */
	.vertical-line {
		position: absolute;
		left: calc(var(--bracket-round-spacing) / -2);
		width: var(--line-width);
		height: calc(var(--prev-matches-height) / 2 + var(--line-width));
		z-index: -1;
	}

	/* Lines that end at the center y of a match */
	.line-down,
	.has-next-round::after,
	.has-prev-round::before {
		top: calc(var(--info-row-height) + var(--side-height));
	}

	/* Lines that start in the center y of a match */
	.line-up {
		bottom: var(--side-height);
	}

	.vertical-line,
	.has-prev-round::before,
	.has-next-round::after {
		background-color: var(--color-gray-100);
	}

	:global(.dark) .vertical-line,
	:global(.dark) .has-prev-round::before,
	:global(.dark) .has-next-round::after {
		background-color: var(--color-gray-900);
	}
</style>
