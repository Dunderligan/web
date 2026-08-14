<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		label: string | Snippet;
		column?: boolean;
		fullWidth?: boolean;
		flipped?: boolean;
		class?: ClassValue;
		children?: Snippet;
	};

	let { label, column, fullWidth, flipped, class: classProp, children }: Props = $props();
</script>

<label
	class={[
		classProp,
		fullWidth ? 'w-full' : 'max-w-xl',
		column ? 'flex-col items-start' : 'items-center',
		flipped ? 'flex-row-reverse justify-end' : 'flex-row',
		'flex gap-2'
	]}
>
	<div
		class={[
			!fullWidth && 'w-1/3 min-w-40',
			'flex shrink grow-0 items-center gap-2 font-medium text-gray-700 dark:text-gray-300'
		]}
	>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</div>

	{@render children?.()}
</label>
