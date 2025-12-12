<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: ClassValue;
		title?: string;
		children?: Snippet;
	};

	let { children, title, class: classProp }: Props = $props();
</script>

<header
	class={[classProp, 'mx-auto mt-2 w-full max-w-4xl px-4 font-display text-black dark:text-white']}
>
	{#if title}
		<h1 class="text-center font-display text-6xl font-extrabold sm:text-left sm:text-7xl">
			{title}
		</h1>
	{/if}

	{@render children?.()}
</header>
