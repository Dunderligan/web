<script lang="ts">
	import { Rank, type AnyRank } from '$lib/types';
	import { capitalize } from '$lib/util';
	import { getRank, getTierLabel, isLegacyRank } from '$lib/rank';
	import bronze from '$lib/assets/images/ranks/bronze.png';
	import silver from '$lib/assets/images/ranks/silver.png';
	import gold from '$lib/assets/images/ranks/gold.png';
	import platinum from '$lib/assets/images/ranks/platinum.png';
	import emerald from '$lib/assets/images/ranks/emerald.png';
	import diamond from '$lib/assets/images/ranks/diamond.png';
	import master from '$lib/assets/images/ranks/master.png';
	import grandmaster from '$lib/assets/images/ranks/grandmaster.png';
	import champion from '$lib/assets/images/ranks/champion.png';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		class?: ClassValue;
		collapse?: boolean;
		rank: AnyRank;
		hideLabel?: boolean;
	};

	let { class: classProp, collapse, rank: fullRank, hideLabel = false }: Props = $props();

	const rank = $derived(getRank(fullRank));

	const imgSrc = $derived(
		{
			[Rank.BRONZE]: bronze,
			[Rank.SILVER]: silver,
			[Rank.GOLD]: gold,
			[Rank.PLATINUM]: platinum,
			[Rank.EMERALD]: emerald,
			[Rank.DIAMOND]: diamond,
			[Rank.MASTER]: master,
			[Rank.GRANDMASTER]: grandmaster,
			[Rank.CHAMPION]: champion
		}[rank]
	);
</script>

<div>
	<img
		src={imgSrc}
		alt={rank}
		title={capitalize(rank)}
		class={[classProp, !hideLabel && 'mr-1', 'inline aspect-auto w-6']}
	/>

	{#if !hideLabel}
		{#if !isLegacyRank(fullRank)}
			<span class={[collapse && 'hidden sm:inline']}>{capitalize(rank)}</span>
		{/if}
		<span>{getTierLabel(fullRank)}</span>
	{/if}
</div>
