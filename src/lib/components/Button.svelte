<script lang="ts">
	import { Button, type ButtonRootProps, type WithoutChildren } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = { icon?: string; kind?: 'primary' | 'secondary' } & (
		| { children: Snippet; label?: never; icon?: never }
		| {
				children?: never;
				label: string;
				icon?: string;
		  }
	) &
		WithoutChildren<ButtonRootProps>;

	let { icon, children, label, class: classProp, kind = 'primary', ...props }: Props = $props();

	const typeClass = $derived(
		{
			primary: 'bg-accent-600 hover:bg-accent-700 font-bold text-white',
			secondary: 'bg-gray-500 hover:bg-gray-600 font-semibold text-gray-200'
		}[kind]
	);
</script>

<Button.Root
	class={[
		classProp,
		typeClass,
		'flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors'
	]}
	{...props}
>
	{#if children}
		{@render children()}
	{:else}
		{#if icon}
			<Icon {icon} class="text-xl" />
		{/if}

		{label}
	{/if}
</Button.Root>
