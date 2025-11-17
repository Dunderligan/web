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
			? 'text-gray-500 bg-gray-200 font-medium'
			: {
					primary: 'bg-accent-600 hover:bg-accent-700 font-semibold text-white',
					secondary: 'bg-gray-500 hover:bg-gray-600 font-semibold text-white',
					tertiary: 'text-gray-500 font-medium hover:bg-gray-50 underline',
					transparent: 'text-accent-800 hover:bg-accent-100 active:bg-accent-200',
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
		'flex items-center justify-center gap-2 rounded-lg transition-colors'
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
