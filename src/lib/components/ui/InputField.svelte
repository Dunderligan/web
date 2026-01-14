<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		onenter?: () => void;
	} & Omit<HTMLInputAttributes, 'onkeydown'>;

	let { class: classProp, value = $bindable(), onenter, ...props }: Props = $props();
</script>

<input
	type="text"
	class={[classProp, 'field min-w-0 grow']}
	onkeydown={(evt) => {
		if (onenter && evt.key === 'Enter') {
			onenter();
		}
	}}
	{...props}
	bind:value
/>
