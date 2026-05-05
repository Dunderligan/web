<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		href: string;
		onclick?: () => void;
		highlighted?: boolean;
		disabled?: boolean;
		children?: Snippet;
	};

	let { href, onclick, highlighted = false, disabled, children }: Props = $props();
</script>

<a
	{href}
	{onclick}
	class={[
		highlighted
			? 'bg-accent-600 py-5 pl-8 font-bold text-white hover:bg-accent-700'
			: 'bg-gray-100 py-2.5 pl-6 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
		disabled && 'pointer-events-none opacity-70',
		'flex min-h-14 items-center justify-between pr-6 text-lg hover:underline'
	]}
>
	<span>{@render children?.()}</span>

	<Icon icon="ph:arrow-right" class="text-xl" />
</a>
