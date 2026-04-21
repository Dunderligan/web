<script lang="ts">
	import type { ChipColor, ClassValue } from '$lib/types';
	import Icon from './Icon.svelte';

	type Props = {
		color: ChipColor;
		label: string;
		icon?: string;
		class?: ClassValue;
	};

	let { color, label, icon, class: classProp }: Props = $props();

	const colorClass = $derived(
		{
			yellow: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
			green: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200',
			gray: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
			accent: 'bg-accent-200 text-accent-900 dark:bg-accent-900 dark:text-white'
		}[color]
	);
</script>

<div
	class={[
		classProp,
		colorClass,
		'flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold'
	]}
>
	{#if icon}
		<Icon class="text-lg" {icon} />
	{/if}

	<span>{label}</span>
</div>
