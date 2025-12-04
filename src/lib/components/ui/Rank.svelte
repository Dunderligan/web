<script lang="ts">
	import { Rank, type AnyRank, type ClassValue, type FullRank } from '$lib/types';
	import { capitalize, getRank, getTierLabel, isLegacyRank } from '$lib/util';

	type Props = {
		class?: ClassValue;
		collapse?: boolean;
		rank: AnyRank;
	};

	let { class: classProp, collapse, rank }: Props = $props();
</script>

<img src="/rank/{getRank(rank)}.png" alt="" class={[classProp, 'mr-2 inline size-7']} />
{#if !isLegacyRank(rank)}
	<span class={['mr-1', collapse && 'hidden sm:inline']}>{capitalize(getRank(rank))}</span>
{/if}
<span>{getTierLabel(rank)}</span>
