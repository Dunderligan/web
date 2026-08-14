<script lang="ts">
	import { Progress, useId } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof Progress.Root> & {
		label?: string;
		valueLabel?: string;
		inline?: boolean;
		color: 'accent' | 'gray' | 'green' | 'yellow';
	};

	let {
		max = 100,
		value = 0,
		min = 0,
		label,
		valueLabel = `${value}/${max}`,
		inline = false,
		color,
		...props
	}: Props = $props();

	const colorClass = $derived(
		{
			accent: 'bg-accent-600 dark:bg-accent-700',
			gray: 'bg-gray-600 dark:bg-gray-700',
			green: 'bg-green-600 dark:bg-green-700',
			yellow: 'bg-yellow-600 dark:bg-yellow-700'
		}[color]
	);
</script>

<div class={[inline ? 'flex-row items-center gap-2' : 'flex-col gap-1', 'flex']}>
	<div class={[inline ? 'text-sm' : 'text-lg', 'shrink-0']}>
		<span class="font-medium">{label}</span>
		<span class="font-semibold">{valueLabel}</span>
	</div>

	<Progress.Root
		{value}
		{min}
		{max}
		{...props}
		aria-valuetext={valueLabel}
		class="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
	>
		<div
			class={[colorClass, 'flex h-full w-full rounded-full']}
			style={`transform: translateX(-${(1 - ((value ?? 0) - min) / (max - min)) * 100}%)`}
		></div>
	</Progress.Root>
</div>
