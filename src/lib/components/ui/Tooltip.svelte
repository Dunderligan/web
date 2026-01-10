<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		content: Snippet;
		children: Snippet;
		class?: ClassValue;
	};

	let { content, children, class: classProp }: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger class={classProp}>
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Content class="floating max-w-sm px-6 py-4">
		{@render content()}
	</Tooltip.Content>
</Tooltip.Root>
