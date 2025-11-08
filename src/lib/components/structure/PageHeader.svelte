<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: ClassValue;
		children?: Snippet;
	};

	let { children, class: classProp }: Props = $props();
</script>

<header class={[classProp, 'mx-auto w-full max-w-4xl px-4 font-display']}>
	{@render children?.()}
</header>
