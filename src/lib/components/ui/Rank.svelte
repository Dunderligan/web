<script lang="ts">
	import type { ClassValue, FullRank } from '$lib/types';
	import { capitalize } from '$lib/util';

	type Props = {
		class?: ClassValue;
		collapse?: boolean;
	} & FullRank;

	let { class: classProp, collapse, rank, tier }: Props = $props();
</script>

<img src="/rank/{rank}.png" alt="" class={[classProp, 'mr-2 inline size-7']} />
<span class={['mr-1', collapse && 'hidden sm:inline']}>{capitalize(rank)}</span>
<span>{tier}</span>
