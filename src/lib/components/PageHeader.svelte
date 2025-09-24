<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	let { children }: Props = $props();
</script>

<header class="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 sm:flex-row">
	{@render children?.()}
</header>
