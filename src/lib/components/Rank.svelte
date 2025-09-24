<script lang="ts">
	import type { ClassValue, FullRank } from '$lib/types';
	import { capitalize } from '$lib/util';

	type Props = {
		class?: ClassValue;
		short?: boolean;
	} & FullRank;

	let { class: classProp, rank, tier }: Props = $props();
</script>

<img src="/rank/{rank}.webp" alt="" class={[classProp, 'mr-1 inline size-6']} />
{capitalize(rank)}
{tier}
