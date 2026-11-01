<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ButtonRootProps, WithoutChildren } from 'bits-ui';

	type ButtonKind = 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'destructive';

	type Content =
		| { children: Snippet; label?: never; icon?: never }
		| { children?: never; label: string; icon?: string }
		| { children?: never; label?: never; icon: string };

	type Props = {
		kind?: ButtonKind;
		loading?: boolean;
		openInNewTab?: boolean;
	} & Content &
		WithoutChildren<ButtonRootProps>;

	let {
		children,
		label,
		icon,
		loading,
		disabled: disabledProp,
		class: classProp,
		kind = 'primary',
		href,
		openInNewTab,
		...props
	}: Props = $props();

	const disabled = $derived(disabledProp || loading);

	const resolvedIcon = $derived(loading ? 'ph:spinner' : icon);

	const typeClass = $derived(
		{
			primary:
				'bg-accent-600 not-disabled:hover:bg-accent-700 font-semibold text-white dark:bg-accent-700 dark:not-disabled:hover:bg-accent-800',
			secondary:
				'bg-gray-200 text-gray-700 not-disabled:hover:bg-gray-300 font-semibold dark:bg-gray-800 dark:not-disabled:hover:bg-gray-700 dark:text-gray-300',
			tertiary:
				'text-gray-600 font-medium not-disabled:hover:bg-gray-50 dark:text-gray-400 dark:not-disabled:hover:bg-gray-800',
			transparent:
				'text-accent-800 not-disabled:hover:bg-accent-100 dark:text-accent-300 dark:not-disabled:hover:bg-accent-950',
			destructive:
				'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-100 not-disabled:hover:bg-red-200/80 font-semibold dark:not-disabled:hover:bg-red-900/80'
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
	{...href && openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}}
	{...props}
>
	{#if children}
		{@render children()}
	{:else}
		{#if resolvedIcon}
			<Icon icon={resolvedIcon} class={[loading && 'animate-spin', 'text-lg']} />
		{/if}

		{label}
	{/if}
</svelte:element>
