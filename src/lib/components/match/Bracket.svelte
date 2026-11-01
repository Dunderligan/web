<script lang="ts">
	import { isInMatch, resolvedMatchToLogical } from '$lib/match';
	import { MatchState, type MatchLineState, type ResolvedMatchWithSeeds } from '$lib/types';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		rounds: ResolvedMatchWithSeeds[][];
		seasonSlug: string;
	};

	let { rounds, seasonSlug }: Props = $props();

	let hoveredRosterId = $state<string | null>(null);

	const collapseFirstRound = $derived.by(() => {
		if (rounds.length === 0) return false;

		for (let i = 0; i < rounds[0].length; i += 2) {
			const match = rounds[0][i];
			if (!isMatchHidden(match)) {
				return false;
			}
		}

		return true;
	});

	function isMatchHidden(match?: ResolvedMatchWithSeeds | null) {
		if (!match) return true;

		// hide the match if only one roster is known (we assume it's a bye)
		return match.state === MatchState.WALKOVER && (!match.rosterA || !match.rosterB);
	}

	function isMatchHovered(match: ResolvedMatchWithSeeds) {
		if (!hoveredRosterId) return false;

		return isInMatch(resolvedMatchToLogical(match), hoveredRosterId);
	}

	function getLineStateToMatch(match: ResolvedMatchWithSeeds | null) {
		if (!match) return 'hidden';

		if (isMatchHidden(match)) {
			return 'hidden';
		}

		if (isMatchHovered(match)) {
			return 'highlighted';
		}

		return 'visible';
	}

	function lineStateUnion(a: MatchLineState, b: MatchLineState): MatchLineState {
		if (a === 'highlighted' || b === 'highlighted') {
			return 'highlighted';
		}

		if (a === 'visible' || b === 'visible') {
			return 'visible';
		}

		return 'hidden';
	}

	function lineStateIntersect(a: MatchLineState, b: MatchLineState): MatchLineState {
		if (a === 'hidden' || b === 'hidden') {
			return 'hidden';
		}

		if (a === 'visible' || b === 'visible') {
			return 'visible';
		}

		return 'highlighted';
	}
</script>

<div
	style="--bracket-rounds: {collapseFirstRound ? rounds.length - 1 : rounds.length}"
	class="bracket mx-auto flex gap-(--bracket-round-spacing)"
>
	{#each rounds as round, i (i)}
		{@const prevRound = i > 0 ? rounds[i - 1] : null}
		{@const roundIndex = collapseFirstRound ? i - 1 : i}

		<div
			style="--bracket-round-index: {roundIndex};"
			class={['flex shrink-0 flex-col justify-around gap-(--bracket-match-spacing)']}
		>
			{#each round as match, j (match.id)}
				{@const nextMatch = rounds[i + 1]?.[Math.floor(j / 2)] ?? null}
				{@const prevMatchAbove = prevRound?.[j * 2] ?? null}
				{@const prevMatchBelow = prevRound?.[j * 2 + 1] ?? null}

				{@const isMatchCollapsed = collapseFirstRound && i === 0 && j % 2 === 0}

				{@const lineState = getLineStateToMatch(match)}

				{@const lines = {
					forward: lineStateIntersect(lineState, getLineStateToMatch(nextMatch)),
					backward: lineStateIntersect(
						lineState,
						lineStateUnion(getLineStateToMatch(prevMatchAbove), getLineStateToMatch(prevMatchBelow))
					),
					up: lineStateIntersect(lineState, getLineStateToMatch(prevMatchAbove)),
					down:
						collapseFirstRound && i <= 1
							? 'hidden'
							: lineStateIntersect(lineState, getLineStateToMatch(prevMatchBelow))
				}}

				<BracketMatch
					{seasonSlug}
					{match}
					{lines}
					bind:hoveredRosterId
					state={isMatchHidden(match) ? (isMatchCollapsed ? 'hidden' : 'invisible') : 'visible'}
				/>
			{/each}
		</div>
	{/each}
</div>

<style>
	.bracket {
		--bracket-round-spacing: calc(var(--spacing) * 10);
		--bracket-match-spacing: calc(var(--spacing) * 3);
	}
</style>
