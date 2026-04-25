<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		children: Snippet;
	};

	let { title, children }: Props = $props();
</script>

<div>
	<div class="font-medium text-gray-700 dark:text-gray-400">{title}</div>
	<div class="text-xl font-semibold text-gray-800 dark:text-gray-300">
		{@render children()}
	</div>
</div>
