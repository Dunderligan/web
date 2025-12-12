<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: ClassValue;
		children?: Snippet;
	};

	let { class: classProp, children }: Props = $props();
</script>

<h2 class={[classProp, 'font-display text-2xl font-bold text-gray-700 dark:text-gray-200']}>
	{@render children?.()}
</h2>
