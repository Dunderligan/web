<script lang="ts" generics="T">
	import { Button } from 'bits-ui';
	import type { ClassValue } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type Item = {
		label: string;
		value: T;
		icon?: string;
		href?: string;
		disabled?: boolean;
	};

	type Props = {
		items: Item[];
		selected?: T;
		class?: ClassValue;
		fillIcons?: boolean;
		onitemclick?: (value: T) => void;
	};

	let {
		items,
		selected = $bindable(items[0].value),
		class: classProp,
		fillIcons = false,
		onitemclick
	}: Props = $props();
</script>

<div class={[classProp, 'flex items-stretch gap-1 overflow-hidden rounded-lg']}>
	{#each items as { label, value, icon, href, disabled } (value)}
		{@const isSelected = selected === value}

		<Button.Root
			{href}
			{disabled}
			onclick={() => {
				if (disabled) return;
				selected = value;
				onitemclick?.(value);
			}}
			class={[
				'flex w-full items-center justify-center gap-2 p-2.5 ease-out',
				disabled
					? 'bg-gray-200 font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400'
					: isSelected
						? 'cursor-default bg-accent-600 font-bold text-white'
						: 'bg-accent-200 font-semibold text-accent-800 hover:bg-accent-300 hover:text-accent-900 dark:bg-accent-900 dark:text-accent-300 dark:hover:bg-accent-800 dark:hover:text-accent-200'
			]}
		>
			{@const renderedIcon = icon && isSelected && fillIcons ? `${icon}-fill` : icon}

			{#if renderedIcon}
				<Icon icon={renderedIcon} class="text-xl" />
			{/if}

			{label}
		</Button.Root>
	{/each}
</div>
