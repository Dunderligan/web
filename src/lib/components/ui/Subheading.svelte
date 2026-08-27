<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		class?: ClassValue;
		children?: Snippet;
	};

	let { class: classProp, children }: Props = $props();
</script>

<h2 class={[classProp, 'font-display text-2xl font-bold text-gray-800 dark:text-gray-100']}>
	{@render children?.()}
</h2>
