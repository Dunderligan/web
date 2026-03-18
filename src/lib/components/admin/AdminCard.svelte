<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		children?: Snippet;
	};

	let { title, children }: Props = $props();
</script>

<div
	class="space-y-4 overflow-hidden rounded-xl border-[3px] border-gray-100 bg-white p-8 dark:border-gray-900 dark:bg-gray-950"
>
	{#if title}
		<h2 class="font-display text-2xl font-bold text-gray-700 dark:text-gray-100">{title}</h2>
	{/if}

	{@render children?.()}
</div>
