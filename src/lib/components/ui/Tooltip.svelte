<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		content: string | Snippet;
		children: Snippet;
		class?: ClassValue;
		underline?: boolean;
	};

	let { content, children, class: classProp, underline }: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		class={[classProp, underline && 'border-b border-dashed border-gray-700 dark:border-gray-400']}
	>
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Content class="floating max-w-md px-6 py-4 font-medium text-gray-800 dark:text-gray-300">
		{#if typeof content === 'string'}
			{content}
		{:else}
			{@render content()}
		{/if}
	</Tooltip.Content>
</Tooltip.Root>
