<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		onenter?: () => void;
	} & Omit<HTMLInputAttributes, 'onkeydown'>;

	let { class: classProp, value = $bindable(), onenter, type = 'text', ...props }: Props = $props();
</script>

<input
	class={[classProp, 'field min-w-0 grow']}
	onkeydown={(evt) => {
		if (onenter && evt.key === 'Enter') {
			onenter();
		}
	}}
	{type}
	{...props}
	bind:value
/>
