<script lang="ts">
	import type { ResolvedMatch } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { matchRoster, isWinner, type MatchSide, matchScore } from '$lib/match';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		match: ResolvedMatch;
		seasonSlug: string;
		prevMatches: number;
		isFirst: boolean;
		isLast: boolean;
		hoveredId?: string | null;
	};

	let {
		match,
		seasonSlug,
		prevMatches,
		isFirst,
		isLast,
		hoveredId = $bindable(null)
	}: Props = $props();

	// don't ask
	const verticalLineHeight = $derived(32 * Math.pow(prevMatches, 2) - 34 * prevMatches + 16);

	function setHovered(rosterId?: string | null) {
		hoveredId = rosterId ?? null;
	}
</script>

<div
	class={[
		!isFirst && 'not-first-match',
		!isLast && 'not-last-match',
		'relative h-[125px] w-[240px] rounded-lg'
	]}
	tabindex="0"
	role="button"
>
	<div
		class="flex h-[25px] items-center gap-4 rounded-t-lg bg-gray-50 px-4 text-sm font-medium text-gray-500"
	>
		{#if match.played}
			<div>
				{match.playedAt ? formatDate(match.playedAt) : 'Okänt datum'}
			</div>

			{#if match.vodUrl}
				<a class="hover:underline" href={match.vodUrl} target="_blank" rel="noopener noreferrer">
					<Icon icon="ph:arrow-square-out" />
					VOD
				</a>
			{/if}
		{:else}
			<div>
				<Icon icon="ph:calendar-blank" />
				Planerad

				{#if match.scheduledAt}
					{formatDateTime(match.scheduledAt)}
				{/if}
			</div>
		{/if}
	</div>

	{@render side('A')}

	<div class="h-[2px] w-full bg-gray-200"></div>

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
			'flex h-[49px] items-center pr-4 transition-all',
			roster && hoveredId === roster?.id
				? 'bg-gray-50'
				: match.played
					? won
						? 'bg-gray-200'
						: 'bg-gray-50'
					: 'bg-gray-100'
		]}
	>
		{#if roster}
			<div
				class={[
					match.played ? 'text-2xl font-extrabold' : 'text-lg font-medium',
					won ? 'text-accent-600' : 'text-gray-400',
					'flex h-full shrink-0 items-center justify-center px-4 text-center'
				]}
			>
				{score ?? '?'}
			</div>

			<RosterLogo id={roster.id} class="mr-2 size-8" />
			<a
				href="/lag/{roster?.slug}/{seasonSlug}"
				class={[
					match.played
						? won
							? 'font-semibold text-gray-900'
							: 'font-medium text-gray-700'
						: 'font-medium text-gray-800',
					'mr-auto truncate hover:underline'
				]}
			>
				{roster?.name}
			</a>
		{:else}
			<div class="grow text-center font-medium text-gray-400">
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
		background-color: var(--color-gray-200);
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
		background-color: var(--color-gray-200);
		z-index: -1;
	}
</style>
