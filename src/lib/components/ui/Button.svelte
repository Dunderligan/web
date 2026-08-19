<script lang="ts">
	import Icon from './Icon.svelte';
	import type { ButtonProps } from '$lib/types';

	let {
		icon: iconProp,
		children,
		loading,
		disabled: disabledProp,
		label,
		class: classProp,
		kind = 'primary',
		href,
		openInNewTab,
		...props
	}: ButtonProps = $props();

	const disabled = $derived(disabledProp || loading);
	const icon = $derived(loading ? 'ph:spinner' : iconProp);

	const typeClass = $derived(
		{
			primary:
				'bg-accent-600 not-disabled:hover:bg-accent-700 font-semibold text-white dark:bg-accent-700 dark:not-disabled:hover:bg-accent-800',
			secondary:
				'bg-gray-200 text-gray-700 not-disabled:hover:bg-gray-300 font-semibold dark:bg-gray-800 dark:not-disabled:hover:bg-gray-700 dark:text-gray-300',
			tertiary:
				'text-gray-600 font-medium not-disabled:hover:bg-gray-50 dark:text-gray-400 dark:not-disabled:hover:bg-gray-800',
			transparent:
				'text-accent-800 not-disabled:hover:bg-accent-100 dark:text-accent-300 dark:not-disabled:hover:bg-accent-900',
			destructive:
				'bg-red-700 not-disabled:hover:bg-red-600 font-semibold text-red-100 not-disabled:hover:text-white dark:bg-red-800 dark:not-disabled:hover:bg-red-700 dark:not-disabled:hover:text-white'
		}[kind]
	);
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	class={[
		classProp,
		typeClass,
		icon && !label ? 'p-2' : 'px-4 py-2',
		disabled && 'cursor-not-allowed opacity-50',
		'inline-flex items-center justify-center gap-2 rounded-lg text-base'
	]}
	{disabled}
	href={disabled ? undefined : href}
	target={openInNewTab ? '_blank' : undefined}
	rel={openInNewTab ? 'noopener noreferrer' : undefined}
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
