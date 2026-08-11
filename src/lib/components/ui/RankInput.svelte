<script lang="ts">
	import { isLegacyRank } from '$lib/rank';
	import type { AnyRank } from '$lib/types';
	import Button from './Button.svelte';
	import InputField from './InputField.svelte';
	import Rank from './Rank.svelte';
	import Select from './Select.svelte';
	import { Rank as RankEnum } from '$lib/types';
	import { capitalize } from '$lib/util';

	type Props = {
		rank: AnyRank;
		disabled?: boolean;
		onValueChange?: (rank: AnyRank) => void;
		onClear?: () => void;
		canClear?: boolean;
	};

	let { rank = $bindable(), disabled, onValueChange, onClear, canClear }: Props = $props();
</script>

{#if isLegacyRank(rank)}
	<Rank {rank} hideLabel />

	<InputField
		type="number"
		placeholder="SR"
		bind:value={
			() => rank.sr.toString(),
			(str) => {
				rank.sr = parseInt(str);
				onValueChange?.(rank);
			}
		}
		{disabled}
	/>

	{#if canClear}
		<Button kind="tertiary" icon="ph:x-circle" class="mr-2" title="Rensa rank" onclick={onClear} />
	{/if}
{:else}
	<Select
		type="single"
		class="grow"
		{canClear}
		bind:value={
			() => rank.rank as string,
			(newValue) => {
				if (newValue) {
					rank.rank = newValue as RankEnum;
					onValueChange?.(rank);
				} else if (canClear) {
					onClear?.();
				}
			}
		}
		items={Object.values(RankEnum).map((rank) => ({
			label: capitalize(rank),
			value: rank
		}))}
		{disabled}
	>
		{#snippet itemSnippet({ value })}
			<Rank rank={{ rank: value as RankEnum, tier: 1 }} class="mr-2" hideLabel />
		{/snippet}
	</Select>

	<Select
		type="single"
		class="w-1/4"
		bind:value={
			() => rank.tier.toString(),
			(str) => {
				rank.tier = parseInt(str);
				onValueChange?.(rank);
			}
		}
		items={[1, 2, 3, 4, 5].map((tier) => ({
			label: tier.toString(),
			value: tier.toString()
		}))}
		{disabled}
	/>
{/if}
