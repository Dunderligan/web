<script lang="ts">
	import { Rank, type AnyRank, type ClassValue } from '$lib/types';
	import { capitalize } from '$lib/util';
	import { getRank, getTierLabel, isLegacyRank } from '$lib/rank';
	import bronze from '$lib/assets/images/ranks/bronze.avif';
	import silver from '$lib/assets/images/ranks/silver.avif';
	import gold from '$lib/assets/images/ranks/gold.avif';
	import platinum from '$lib/assets/images/ranks/platinum.avif';
	import emerald from '$lib/assets/images/ranks/emerald.avif';
	import diamond from '$lib/assets/images/ranks/diamond.avif';
	import master from '$lib/assets/images/ranks/master.avif';
	import grandmaster from '$lib/assets/images/ranks/grandmaster.avif';
	import champion from '$lib/assets/images/ranks/champion.avif';

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
		class={[classProp, !hideLabel && 'mr-1', 'inline size-7']}
	/>

	{#if !hideLabel}
		{#if !isLegacyRank(fullRank)}
			<span class={[collapse && 'hidden sm:inline']}>{capitalize(rank)}</span>
		{/if}
		<span>{getTierLabel(fullRank)}</span>
	{/if}
</div>
