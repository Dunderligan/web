<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		description?: Snippet;
		children?: Snippet;
	};

	let { title, description, children }: Props = $props();
</script>

<div
	class="space-y-4 overflow-hidden rounded-xl border-[3px] border-gray-100 bg-white p-8 text-gray-700 dark:border-gray-900 dark:bg-gray-950 dark:text-gray-300"
>
	{#if title}
		<h2 class="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
	{/if}

	{#if description}
		<div class="-mt-2 mb-6 font-medium">
			{@render description()}
		</div>
	{/if}

	{@render children?.()}
</div>
