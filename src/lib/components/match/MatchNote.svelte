<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import Tooltip from '../ui/Tooltip.svelte';

	type Props = {
		note: string;
		class?: ClassValue;
	};

	let { note, class: classProp }: Props = $props();
</script>

<Tooltip class={[classProp, 'flex items-center justify-center p-0.5 text-xl text-accent-600']}>
	<Icon icon="ph:info-fill" />

	{#snippet content()}
		<p class="font-medium">
			{note}
		</p>
	{/snippet}
</Tooltip>
