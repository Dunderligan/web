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
		hideSelectedIcon?: boolean;
		onitemclick?: (value: T) => void;
	};

	let {
		items,
		selected = $bindable(items[0].value),
		class: classProp,
		hideSelectedIcon = false,
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
				'flex w-full items-center justify-center gap-2 p-2.5',
				disabled
					? 'bg-gray-200 font-semibold text-gray-500'
					: isSelected
						? 'bg-accent-600 font-bold text-white'
						: 'bg-accent-200 font-semibold text-accent-800'
			]}
		>
			{@const renderedIcon = isSelected && !hideSelectedIcon ? null : icon}

			{#if renderedIcon}
				<Icon icon={renderedIcon} />
			{/if}

			{label}
		</Button.Root>
	{/each}
</div>
