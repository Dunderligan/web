<script lang="ts">
	import { Button } from 'bits-ui';
	import Chip from '../ui/Chip.svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		checked?: boolean;
		onclick?: () => void;
		href?: string;
		label: string;
		icon?: string;
		class?: ClassValue;
	};

	let {
		checked = $bindable(false),
		onclick,
		href,
		class: classProp,
		...restProps
	}: Props = $props();
</script>

<Button.Root
	{href}
	data-sveltekit-replacestate
	data-sveltekit-noscroll
	onclick={() => {
		checked = !checked;
		onclick?.();
	}}
>
	<Chip
		color={checked ? 'accent' : 'gray'}
		class={[
			classProp,
			checked
				? 'hover:bg-accent-300 dark:hover:bg-accent-800'
				: 'hover:bg-gray-300 dark:hover:bg-gray-700'
		]}
		{...restProps}
	/>
</Button.Root>
