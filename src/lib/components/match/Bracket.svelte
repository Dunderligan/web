<script lang="ts">
	import { MatchState, type ResolvedMatchWithSeeds } from '$lib/types';
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
</script>

<div
	style="--bracket-rounds: {collapseFirstRound ? rounds.length - 1 : rounds.length}"
	class="bracket w-full overflow-x-auto xl:overflow-x-visible"
>
	<div class="flex gap-(--bracket-round-spacing)">
		{#each rounds as round, i (i)}
			{@const prevRound = i > 0 ? rounds[i - 1] : null}
			{@const roundIndex = collapseFirstRound ? i - 1 : i}
			{@const isCollapsed = false}

			<div
				style="--bracket-round-index: {roundIndex};"
				class={[
					isCollapsed && '-mr-[calc(var(--bracket-round-spacing)/2)]',
					'flex shrink-0 flex-col justify-around gap-(--bracket-match-spacing)'
				]}
			>
				{#each round as match, j (match.id)}
					{@const prevAbove = !isMatchHidden(prevRound?.[j * 2])}
					{@const prevBelow = !isMatchHidden(prevRound?.[j * 2 + 1])}

					<BracketMatch
						{seasonSlug}
						{match}
						bind:hoveredRosterId
						state={isMatchHidden(match)
							? collapseFirstRound && i === 0 && j % 2 === 0
								? 'hidden'
								: 'invisible'
							: 'visible'}
						lines={{
							forward: !isCollapsed && i < rounds.length - 1,
							backward: i > 0 && (prevAbove || prevBelow),
							up: prevAbove,
							down: prevBelow && (!collapseFirstRound || i > 1)
						}}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.bracket {
		--bracket-round-spacing: calc(var(--spacing) * 6);
		--bracket-match-spacing: calc(var(--spacing) * 4);
	}
</style>
