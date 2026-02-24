<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: ClassValue;
		title?: string;
		subtitle?: string;
		children?: Snippet;
	};

	let { children, title, subtitle, class: classProp }: Props = $props();
</script>

<header
	class={[
		classProp,
		'mx-auto mt-2 w-full max-w-4xl px-4 font-display text-gray-950 md:px-0 dark:text-gray-50'
	]}
>
	{#if title}
		<h1 class="text-center font-display text-6xl font-extrabold sm:text-left sm:text-7xl">
			{title}
		</h1>
	{/if}

	{#if subtitle}
		<div
			class="mt-2 mb-1 text-center text-xl font-semibold text-gray-600 sm:text-left dark:text-gray-400"
		>
			{subtitle}
		</div>
	{/if}

	{@render children?.()}
</header>
