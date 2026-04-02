<script lang="ts">
	import { MatchState, type ResolvedMatch, type ResolvedMatchWithSeeds } from '$lib/types';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		rounds: ResolvedMatchWithSeeds[][];
		seasonSlug: string;
	};

	let { rounds, seasonSlug }: Props = $props();

	function isMatchHidden(match?: ResolvedMatchWithSeeds | null) {
		if (!match) return true;

		// hide the match if only one roster is known (we assume it's a bye)
		return match.state === MatchState.WALKOVER && (!match.rosterA || !match.rosterB);
	}
</script>

<div class="w-full overflow-x-auto rounded-lg p-1">
	<div class="flex gap-15">
		{#each rounds as round, i (i)}
			{@const prevRound = i > 0 ? rounds[i - 1] : null}

			<div class="flex shrink-0 flex-col justify-around gap-8">
				{#each round as match, j (match.id)}
					{@const prevAbove = prevRound?.[j * 2]}
					{@const prevBelow = prevRound?.[j * 2 + 1]}

					<BracketMatch
						{seasonSlug}
						{match}
						roundIndex={i}
						hidden={isMatchHidden(match)}
						hasNext={i < rounds.length - 1}
						hasPrevAbove={!isMatchHidden(prevAbove)}
						hasPrevBelow={!isMatchHidden(prevBelow)}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>
