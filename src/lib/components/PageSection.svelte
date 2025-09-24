<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	let { children }: Props = $props();
</script>

<main class="relative z-10 mt-14 grow bg-white px-4 py-12 shadow-2xl">
	<div class="mx-auto flex max-w-4xl flex-col-reverse gap-10 sm:flex-row">
		{@render children?.()}
	</div>
</main>
