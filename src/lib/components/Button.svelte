<script lang="ts">
	import { Button, type ButtonRootProps, type WithoutChildren } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ButtonKind } from '$lib/types';

	type Props = {
		icon?: string;
		kind?: ButtonKind;
	} & (
		| { children: Snippet; label?: never; icon?: never }
		| {
				children?: never;
				label: string;
				icon?: string;
		  }
		| {
				children?: never;
				label?: never;
				icon: string;
		  }
	) &
		WithoutChildren<ButtonRootProps>;

	let {
		icon,
		children,
		disabled,
		label,
		class: classProp,
		kind = 'primary',
		...props
	}: Props = $props();

	const typeClass = $derived(
		disabled
			? 'text-gray-400 bg-gray-100 font-medium'
			: {
					primary: 'bg-accent-600 enabled:hover:bg-accent-700 font-semibold text-white',
					secondary: 'bg-gray-400 enabled:hover:bg-gray-500 font-semibold text-white',
					tertiary: 'text-gray-600 enabled:hover:bg-gray-100',
					transparent: 'text-accent-800 enabled:hover:bg-accent-100 enabled:active:bg-accent-200',
					negative:
						'bg-red-700 enabled:hover:bg-red-600 font-semibold text-red-100 enabled:hover:text-white'
				}[kind]
	);
</script>

<Button.Root
	class={[
		classProp,
		typeClass,
		icon && !label ? 'p-2' : 'px-4 py-2',
		disabled && 'cursor-not-allowed',
		'flex items-center justify-center gap-2 rounded-lg transition-colors'
	]}
	{disabled}
	{...props}
>
	{#if children}
		{@render children()}
	{:else}
		{#if icon}
			<Icon {icon} class="text-lg" />
		{/if}

		{label}
	{/if}
</Button.Root>
