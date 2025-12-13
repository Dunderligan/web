<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: ClassValue;
		topMargin?: boolean;
		children?: Snippet;
	};

	let { children, topMargin = true, class: classProp }: Props = $props();
</script>

<main
	class={[
		topMargin && 'mt-20',
		'relative z-0 grow overflow-hidden bg-white px-4 pt-12 pb-20 text-gray-800 shadow-2xl dark:bg-gray-950 dark:text-gray-300'
	]}
>
	<div class={[classProp, 'mx-auto max-w-4xl']}>
		{@render children?.()}
	</div>

	<div class="halftone pointer-events-none absolute bottom-0 -z-10 h-[600px] w-[1200px]"></div>
</main>

<style>
	.halftone {
		mask-image: url('/halftone-bg.avif');
		mask-size: cover;
		mask-position: left;
		mask-repeat: no-repeat;

		background-image: linear-gradient(
			to top right,
			var(--color-gray-100) 0%,
			var(--color-white) 50%
		);
	}

	:global(.dark) .halftone {
		background-image: linear-gradient(
			to top right,
			var(--color-gray-800) 0%,
			var(--color-gray-950) 50%
		);
	}
</style>
