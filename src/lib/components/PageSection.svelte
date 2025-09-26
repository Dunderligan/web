<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	let { children }: Props = $props();
</script>

<main class="relative z-0 mt-14 grow bg-white px-4 py-12 shadow-2xl">
	<div class="mx-auto flex max-w-4xl flex-col-reverse gap-10 sm:flex-row">
		{@render children?.()}
	</div>
</main>

<style>
	/* main::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 100%;
		height: 50rem;
		background: var(
			--color-gray-200
		);
		mask-image: url('/dotted-bg.svg');
		mask-repeat: repeat;
		pointer-events: none;
		z-index: -1;
	} */
</style>
