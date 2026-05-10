<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	type Props = {
		icon?: string;
		onenter?: () => void;
	} & Omit<HTMLInputAttributes, 'onkeydown'>;

	let {
		icon,
		class: classProp,
		value = $bindable(),
		onenter,
		type = 'text',
		...props
	}: Props = $props();
</script>

<input
	class={[classProp, icon && 'pl-10', 'field min-w-0 grow']}
	onkeydown={(evt) => {
		if (onenter && evt.key === 'Enter') {
			onenter();
		}
	}}
	{type}
	{...props}
	bind:value
/>

{#if icon}
	<Icon {icon} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
{/if}
