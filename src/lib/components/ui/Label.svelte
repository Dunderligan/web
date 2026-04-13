<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string | Snippet;
		column?: boolean;
		children?: Snippet;
	};

	let { label, column = false, children }: Props = $props();
</script>

<div class={['flex max-w-xl gap-2', column ? 'flex-col items-start' : 'items-center']}>
	<div
		class="flex w-1/3 min-w-40 shrink grow-0 items-center gap-2 font-medium text-gray-700 dark:text-gray-300"
	>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</div>

	{@render children?.()}
</div>
