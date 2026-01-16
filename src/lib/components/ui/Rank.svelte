<script lang="ts">
	import { type AnyRank, type ClassValue } from '$lib/types';
	import { capitalize } from '$lib/util';
	import { getRank, getTierLabel, isLegacyRank } from '$lib/rank';
	import bronze from '$lib/assets/images/ranks/bronze.png';
	import silver from '$lib/assets/images/ranks/silver.png';
	import gold from '$lib/assets/images/ranks/gold.png';
	import platinum from '$lib/assets/images/ranks/platinum.png';
	import diamond from '$lib/assets/images/ranks/diamond.png';
	import master from '$lib/assets/images/ranks/master.png';
	import grandmaster from '$lib/assets/images/ranks/grandmaster.png';
	import champion from '$lib/assets/images/ranks/champion.png';

	type Props = {
		class?: ClassValue;
		collapse?: boolean;
		rank: AnyRank;
		hideLabel?: boolean;
	};

	let { class: classProp, collapse, rank: fullRank, hideLabel = false }: Props = $props();

	const rank = $derived(getRank(fullRank));

	const imgSrc = $derived.by(() => {
		switch (rank) {
			case 'bronze':
				return bronze;
			case 'silver':
				return silver;
			case 'gold':
				return gold;
			case 'platinum':
				return platinum;
			case 'diamond':
				return diamond;
			case 'master':
				return master;
			case 'grandmaster':
				return grandmaster;
			case 'champion':
				return champion;
		}
	});
</script>

<img
	src={imgSrc}
	alt={rank}
	title={capitalize(rank)}
	class={[classProp, !hideLabel && 'mr-2', 'inline size-7']}
/>

{#if !hideLabel}
	{#if !isLegacyRank(fullRank)}
		<span class={['mr-1', collapse && 'hidden sm:inline']}>{capitalize(rank)}</span>
	{/if}

	<span>{getTierLabel(fullRank)}</span>
{/if}
