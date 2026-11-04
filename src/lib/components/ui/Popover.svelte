<script lang="ts">
	import { Popover } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { fade } from 'svelte/transition';

	type Props = {
		content: Snippet;
		children: Snippet;
		class?: ClassValue;
	};

	let { content, children, class: classProp }: Props = $props();
</script>

<Popover.Root>
	<Popover.Trigger class={[classProp]}>
		{@render children()}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			forceMount
			class="floating relative max-w-md px-6 py-4 font-medium text-gray-800 dark:text-gray-300"
		>
			{#snippet child({ open, props, wrapperProps })}
				<div {...wrapperProps}>
					{#if open}
						<div {...props} transition:fade={{ duration: 25 }}>
							{@render content()}
						</div>
					{/if}
				</div>
			{/snippet}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
