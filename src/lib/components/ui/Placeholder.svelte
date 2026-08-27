<script lang="ts">
	import type { PlaceholderProps } from '$lib/types';
	import Icon from './Icon.svelte';

	let { icon, text, class: classProp, ...rest }: PlaceholderProps = $props();
</script>

<div
	class={[
		classProp,
		'w-full space-y-2 rounded-lg bg-gray-100 p-10 text-center text-gray-600 dark:bg-gray-900 dark:text-gray-300'
	]}
	{...rest}
>
	{#if icon}
		<Icon {icon} class="mx-auto block text-2xl" />
	{/if}

	<span class="font-medium">{text}</span>
</div>
