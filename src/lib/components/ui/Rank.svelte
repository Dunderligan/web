<script lang="ts">
	import { type AnyRank, type ClassValue } from '$lib/types';
	import { capitalize, getRank, getTierLabel, isLegacyRank } from '$lib/util';

	type Props = {
		class?: ClassValue;
		collapse?: boolean;
		rank: AnyRank;
		hideLabel?: boolean;
	};

	let { class: classProp, collapse, rank, hideLabel = false }: Props = $props();
</script>

<img
	src="/rank/{getRank(rank)}.png"
	alt={getRank(rank)}
	title={capitalize(getRank(rank))}
	class={[classProp, !hideLabel && 'mr-2', 'inline size-7']}
/>
{#if !hideLabel}
	{#if !isLegacyRank(rank)}
		<span class={['mr-1', collapse && 'hidden sm:inline']}>{capitalize(getRank(rank))}</span>
	{/if}

	<span>{getTierLabel(rank)}</span>
{/if}
