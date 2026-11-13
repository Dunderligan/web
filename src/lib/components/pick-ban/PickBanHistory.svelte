<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<div class={[classProp, 'rounded-xl border-[3px] border-gray-200 bg-white p-6']}>
	{#each context.state.maps as entry, index (index)}
		<div></div>
	{/each}
</div>
