<script lang="ts">
	import { RosterContext } from '$lib/state/rosters.svelte';
	import type { MatchRoster, ResolvedMatch } from '$lib/types';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		rounds: ResolvedMatch[][];
		seasonSlug: string;
	};

	let { rounds, seasonSlug }: Props = $props();
</script>

<div class="w-full overflow-x-auto rounded-lg p-1">
	<div class="flex min-w-3xl items-stretch">
		{#each rounds as round, i (i)}
			<div class="flex flex-col justify-evenly gap-8" style="width: {100 / rounds.length}%;">
				{#each round as match (match.id)}
					<BracketMatch {seasonSlug} {match} />
				{/each}
			</div>

			{#if i < rounds.length - 1}
				<div class="flex flex-col">
					{#each Array.from({ length: round.length / 2 }) as i}
						{@const width = 80}

						<svg {width} height="100%" xmlns="http://www.w3.org/2000/svg">
							<line y2="25%" x2={width / 2} y1="25%" x1="0" stroke="#d1d5dc" stroke-width="1" />
							<line y2="75%" x2={width / 2} y1="75%" x1="0" stroke="#d1d5dc" stroke-width="1" />

							<line y2="50%" x2={width / 2} y1="50%" x1={width} stroke="#d1d5dc" stroke-width="1" />
							<line
								y2="75%"
								x2={width / 2}
								y1="25%"
								x1={width / 2}
								stroke="#d1d5dc"
								stroke-width="1"
							/>
						</svg>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</div>
