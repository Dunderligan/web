<script lang="ts">
	import type { Placement } from '$lib/types';
	import Icon from './Icon.svelte';

	type Props = Placement;

	let { best, worst }: Props = $props();

	const icon = $derived(
		{
			1: 'ph:trophy',
			2: 'ph:medal',
			3: 'ph:medal'
		}[best]
	);

	const label = $derived.by(() => {
		if (worst) {
			return `Top ${worst}`;
		}
		return `${best}:a`;
	});
</script>

<div
	class={[
		best === 1
			? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-200'
			: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
		'relative flex max-w-max items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-1 text-lg font-semibold whitespace-nowrap'
	]}
>
	{#if icon}
		<Icon {icon} />
	{/if}

	{label}
</div>
