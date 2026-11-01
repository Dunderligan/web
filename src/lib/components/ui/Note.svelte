<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import Tooltip from './Tooltip.svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		class?: ClassValue;
		content: string | Snippet;
	};

	let { class: classProp, content }: Props = $props();
</script>

<Tooltip
	{content}
	class={[classProp, 'flex items-center justify-center p-0.5 text-xl text-accent-600']}
>
	<Icon icon="ph:info-fill" />
</Tooltip>
