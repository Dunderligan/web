<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string | Snippet;
		children?: Snippet;
	};

	let { label, children }: Props = $props();
</script>

<div class="flex max-w-xl items-center">
	<div class="flex max-w-48 grow items-center gap-2 font-semibold text-gray-700">
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</div>

	{@render children?.()}
</div>
