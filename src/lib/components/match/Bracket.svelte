<script lang="ts">
	import type { ResolvedMatch } from '$lib/types';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		rounds: ResolvedMatch[][];
		seasonSlug: string;
	};

	let { rounds, seasonSlug }: Props = $props();

	let hoveredRosterId: string | null = $state(null);
</script>

<div class="w-full overflow-x-auto rounded-lg p-1">
	<div class="flex gap-[60px]">
		{#each rounds as round, i (i)}
			<div class="flex shrink-0 flex-col justify-around gap-8">
				{#each round as match (match.id)}
					<BracketMatch
						bind:hoveredId={hoveredRosterId}
						{seasonSlug}
						{match}
						isFirst={i == 0}
						isLast={i == rounds.length - 1}
						prevMatches={i}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>
