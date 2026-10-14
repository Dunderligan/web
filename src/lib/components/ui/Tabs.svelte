<script lang="ts" generics="T">
	import type { ClassValue } from 'svelte/elements';
	import Icon from './Icon.svelte';
	import { Button } from 'bits-ui';

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

<div class={[classProp, 'flex items-stretch gap-1 overflow-x-auto']}>
	{#each items as { label, value, icon, href, disabled } (value)}
		{@const isSelected = selected === value}
		{@const renderedIcon = icon && isSelected && fillIcons ? `${icon}-fill` : icon}

		<Button.Root
			{href}
			{disabled}
			data-sveltekit-noscroll
			role="tab"
			tabindex={isSelected ? 0 : -1}
			onclick={() => {
				if (disabled) return;
				selected = value;
				onitemclick?.(value);
			}}
			class={[
				'flex grow basis-0 items-center justify-center gap-2 px-4 py-2.5 font-semibold whitespace-nowrap first:rounded-l-lg last:rounded-r-lg',
				disabled && 'cursor-not-allowed opacity-50',
				isSelected
					? 'cursor-default bg-accent-600 text-white dark:bg-accent-700'
					: [
							!disabled &&
								'hover:bg-accent-300 hover:text-accent-900 dark:hover:bg-accent-900 dark:hover:text-accent-200',
							'bg-accent-200 text-accent-800 dark:bg-accent-950 dark:text-accent-300 '
						]
			]}
		>
			{#if renderedIcon}
				<Icon icon={renderedIcon} class="text-xl" />
			{/if}

			{label}
		</Button.Root>
	{/each}
</div>
