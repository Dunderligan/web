<script lang="ts">
	import { type ButtonRootProps, type WithoutChildren } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ButtonKind } from '$lib/types';

	type Props = {
		icon?: string;
		kind?: ButtonKind;
		loading?: boolean;
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
		icon: iconProp,
		children,
		loading,
		disabled: disabledProp,
		label,
		class: classProp,
		kind = 'primary',
		href,
		...props
	}: Props = $props();

	const disabled = $derived(disabledProp || loading);
	const icon = $derived(loading ? 'ph:spinner' : iconProp);

	const typeClass = $derived(
		disabled
			? 'text-gray-500 bg-gray-200 font-medium dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed'
			: {
					primary: 'bg-accent-600 hover:bg-accent-700 font-semibold text-white',
					secondary:
						'bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300',
					tertiary:
						'text-gray-600 font-medium hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800',
					transparent:
						'text-accent-800 hover:bg-accent-100 dark:text-accent-300 dark:hover:bg-accent-900',
					negative: 'bg-red-700 hover:bg-red-600 font-semibold text-red-100 hover:text-white'
				}[kind]
	);
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	class={[
		classProp,
		typeClass,
		icon && !label ? 'p-2' : 'px-4 py-2',
		disabled && 'cursor-not-allowed',
		'inline-flex items-center justify-center gap-2 rounded-lg'
	]}
	{disabled}
	{href}
	{...props}
>
	{#if children}
		{@render children()}
	{:else}
		{#if icon}
			<Icon {icon} class={[loading && 'animate-spin', 'text-lg']} />
		{/if}

		{label}
	{/if}
</svelte:element>
