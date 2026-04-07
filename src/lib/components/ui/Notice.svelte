<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ClassValue } from '$lib/types';

	type Props = {
		kind: 'info' | 'warn' | 'error';
		children?: Snippet;
		class?: ClassValue;
	};

	let { kind, children, class: classProp }: Props = $props();

	const { icon, class: kindClass } = $derived(
		{
			info: {
				icon: 'ph:info',
				class: 'bg-accent-50 text-accent-800 dark:bg-accent-950 dark:text-accent-300'
			},
			warn: {
				icon: 'ph:warning',
				class: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
			},
			error: {
				icon: 'ph:x-circle',
				class: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
			}
		}[kind]
	);
</script>

<div
	class={[
		kindClass,
		classProp,
		'flex min-h-14 items-center gap-2 rounded-lg py-2 pr-3 pl-6 font-medium'
	]}
>
	<Icon {icon} />

	{@render children?.()}
</div>
