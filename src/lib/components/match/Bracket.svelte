<script lang="ts">
	import { MatchState, type ResolvedMatchWithSeeds } from '$lib/types';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		rounds: ResolvedMatchWithSeeds[][];
		seasonSlug: string;
	};

	let { rounds, seasonSlug }: Props = $props();

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

<div class="w-full overflow-x-auto xl:overflow-x-visible">
	<div class="flex gap-15">
		{#each rounds as round, i (i)}
			{@const prevRound = i > 0 ? rounds[i - 1] : null}

			<div class="flex shrink-0 flex-col justify-around gap-8">
				{#each round as match, j (match.id)}
					{@const prevAbove = !isMatchHidden(prevRound?.[j * 2])}
					{@const prevBelow = !isMatchHidden(prevRound?.[j * 2 + 1])}

					<BracketMatch
						{seasonSlug}
						{match}
						roundIndex={collapseFirstRound ? i - 1 : i}
						state={isMatchHidden(match)
							? collapseFirstRound && i === 0 && j % 2 === 0
								? 'hidden'
								: 'invisible'
							: 'visible'}
						lines={{
							forward: i < rounds.length - 1,
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
