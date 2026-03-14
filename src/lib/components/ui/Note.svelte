<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import Tooltip from './Tooltip.svelte';

	type Props = {
		class?: ClassValue;
		content: string | Snippet;
	};

	let { class: classProp, content: noteContent }: Props = $props();
</script>

<Tooltip class={[classProp, 'flex items-center justify-center p-0.5 text-xl text-accent-600']}>
	<Icon icon="ph:info-fill" />

	{#snippet content()}
		{#if typeof noteContent === 'string'}
			<p class="font-medium">
				{noteContent}
			</p>
		{:else}
			{@render noteContent()}
		{/if}
	{/snippet}
</Tooltip>
