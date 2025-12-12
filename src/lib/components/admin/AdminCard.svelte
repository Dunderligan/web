<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		children?: Snippet;
	};

	let { title, children }: Props = $props();
</script>

<div
	class="space-y-4 overflow-hidden rounded-xl border-[3px] border-gray-100 bg-white px-8 py-6 dark:border-gray-900 dark:bg-gray-950"
>
	<h2 class="font-display text-2xl font-bold text-gray-700 dark:text-gray-100">{title}</h2>

	{@render children?.()}
</div>
