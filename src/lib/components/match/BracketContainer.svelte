<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		class?: ClassValue;
		children?: Snippet;
	};

	let { class: classProp, children }: Props = $props();
</script>

<div
	class={[
		classProp,
		'relative left-1/2 w-screen max-w-max -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950'
	]}
>
	<div class="bracket-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

	<div class="z-10 overflow-x-auto px-8 py-6 sm:px-12 sm:py-8">
		{@render children?.()}
	</div>
</div>

<style>
	.bracket-grid {
		background-image: radial-gradient(circle, var(--color-gray-300) 1px, transparent 1px);
		background-position: center;
		background-size: 16px 16px;
		opacity: 0.5;
	}

	:global(.dark) .bracket-grid {
		background-image: radial-gradient(circle, var(--color-gray-700) 1px, transparent 1px);
		opacity: 0.85;
	}
</style>
