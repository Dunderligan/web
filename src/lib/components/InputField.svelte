<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		onenter?: () => void;
	} & Omit<HTMLInputAttributes, 'onkeydown'>;

	let { class: classProp, value = $bindable(), onenter, ...props }: Props = $props();
</script>

<input
	type="text"
	class={[
		classProp,
		'min-w-0 grow rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-800 placeholder-gray-400 transition-shadow duration-75 focus:ring-2 focus:ring-accent-600 focus:outline-none'
	]}
	onkeydown={(evt) => {
		if (onenter && evt.key === 'Enter') {
			onenter();
		}
	}}
	{...props}
	bind:value
/>
