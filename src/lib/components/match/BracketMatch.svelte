<script lang="ts">
	import type { ResolvedMatch } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { matchRoster, isWinner, type MatchSide, matchScore } from '$lib/match';
	import MatchInfoRow from './MatchInfoRow.svelte';

	type Props = {
		match: ResolvedMatch;
		seasonSlug: string;
		prevMatches: number;
		isFirst: boolean;
		isLast: boolean;
	};

	let { match, seasonSlug, prevMatches, isFirst, isLast }: Props = $props();

	// don't ask
	const verticalLineHeight = $derived(32 * Math.pow(prevMatches, 2) - 34 * prevMatches + 16);
</script>

<div
	class={[
		!isFirst && 'not-first-match',
		!isLast && 'not-last-match',
		'relative h-[125px] w-60 rounded-lg'
	]}
	tabindex="0"
	role="button"
>
	<MatchInfoRow class="h-[25px] rounded-t-lg bg-gray-100 px-4 dark:bg-gray-900" {match} />

	{@render side('A')}

	<div class="divider h-0.5 w-full"></div>

	{@render side('B', 'rounded-b-lg')}

	{#if !isFirst}
		<div
			class="vertical-line"
			style="top: calc(-{verticalLineHeight}% + 1px); bottom: calc(-{verticalLineHeight}% + 1px);"
		></div>
	{/if}
</div>

{#snippet side(side: MatchSide, classProp?: string)}
	{@const roster = matchRoster(match, side)}
	{@const won = isWinner(match, side)}
	{@const score = matchScore(match, side)}

	<!-- onmouseenter={() => setHovered(roster?.id)}
		onmouseleave={() => setHovered(null)}
		onfocus={() => setHovered(roster?.id)}
		onblur={() => setHovered(null)} -->

	<div
		class={[
			classProp,
			'flex h-[49px] items-center pr-4 font-medium text-gray-700 dark:text-gray-300',
			match.played
				? won
					? 'bg-gray-200 dark:bg-gray-800'
					: 'bg-gray-50 dark:bg-gray-900'
				: 'bg-gray-100 dark:bg-gray-900'
		]}
	>
		{#if roster}
			<div
				class={[
					match.played ? 'text-2xl font-extrabold' : 'text-lg',
					won ? 'text-accent-600 dark:text-accent-500' : 'text-gray-500 dark:text-gray-400',
					'flex h-full shrink-0 items-center justify-center px-4 text-center'
				]}
			>
				{score ?? '?'}
			</div>

			<RosterLogo id={roster.id} class="mr-2 size-8" />
			<a
				href="/lag/{roster?.slug}/{seasonSlug}"
				class={[
					won && 'font-semibold text-gray-800 dark:text-gray-200',
					'mr-auto truncate hover:underline'
				]}
			>
				{roster?.name}
			</a>
		{:else}
			<div class="grow text-center font-medium">
				{match.played ? '---' : '???'}
			</div>
		{/if}
	</div>
{/snippet}

<style>
	/* Horizontal lines connecting rounds */
	.not-last-match::after,
	.not-first-match::before {
		content: '';
		position: absolute;
		height: 2px;
		z-index: -1;
	}

	/* Forwards line to next round. */
	.not-last-match::after {
		top: calc(50% + 25px / 2 - 1px);
		right: -32px;
		left: 100%;
	}

	/* Backwards line to previous round. */
	.not-first-match::before {
		top: calc(50% + 25px / 2 - 1px);
		right: 100%;
		left: -30px;
	}

	/* Vertical line connecting to previous/next match. */
	.vertical-line {
		position: absolute;
		left: -30px;
		width: 2px;
		transform: translateY(calc(25px / 2));
		z-index: -1;
	}

	.divider,
	.vertical-line,
	.not-last-match::after,
	.not-first-match::before {
		background-color: var(--color-gray-200);
	}

	:global(.dark) .divider,
	:global(.dark) .vertical-line,
	:global(.dark) .not-last-match::after,
	:global(.dark) .not-first-match::before {
		background-color: var(--color-gray-800);
	}
</style>
