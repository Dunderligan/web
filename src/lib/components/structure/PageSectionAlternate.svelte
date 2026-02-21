<script lang="ts">
	import type { Snippet } from 'svelte';

	type Style = 'muted' | 'accent' | 'neutral';

	type Props = {
		class?: string;
		style?: Style;
		children?: Snippet;
	};

	let { class: classProp, style = 'neutral', children }: Props = $props();

	const styleClass = $derived.by(() => {
		switch (style) {
			case 'muted':
				return 'bg-gray-600 text-white dark:bg-gray-900 dark:text-gray-200';
			case 'accent':
				return 'bg-accent-700 text-accent-100 dark:bg-accent-900 dark:text-accent-200';
			case 'neutral':
			default:
				return 'bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	});
</script>

<section
	class={['relative z-0 grow overflow-hidden px-4 py-20 text-center', styleClass, classProp]}
>
	<div class="mx-auto max-w-4xl px-4">
		{@render children?.()}
	</div>

	<div
		class="topo-bg absolute inset-0 -z-10 opacity-60 mix-blend-multiply saturate-0 dark:opacity-100"
	></div>
</section>

<style>
	.topo-bg {
		background-position: center;
		background-size: cover;
		background-image:
			linear-gradient(
				to right,
				rgba(255, 255, 255, 0.2) 15%,
				rgba(255, 255, 255, 0.85) 30%,
				rgba(255, 255, 255, 0.85) 70%,
				rgba(255, 255, 255, 0.2) 85%
			),
			url('$lib/assets/images/topo-bg.avif');
	}
</style>
