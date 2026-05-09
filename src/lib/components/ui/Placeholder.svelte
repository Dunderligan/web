<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type Props = {
		icon?: string;
		text: string;
		onclick?: () => void;
		class?: ClassValue;
	};

	let { icon, text, class: classProp, ...rest }: Props = $props();
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
