<script lang="ts">
	import type { ResolvedMatch } from '$lib/types';
	import BracketMatch from './BracketMatch.svelte';

	type Props = {
		rounds: ResolvedMatch[][];
		seasonSlug: string;
	};

	let { rounds, seasonSlug }: Props = $props();
</script>

<div class="w-full overflow-x-auto rounded-lg p-1">
	<div class="flex min-w-3xl items-stretch gap-12">
		{#each rounds as round, i (i)}
			<div class="flex flex-col justify-around gap-8" style="width: {100 / rounds.length}%;">
				{#each round as match (match.id)}
					<BracketMatch
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
