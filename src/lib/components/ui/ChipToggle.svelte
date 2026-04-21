<script lang="ts">
	import type { ClassValue } from '$lib/types';
	import Chip from './Chip.svelte';

	type Props = {
		checked?: boolean;
		label: string;
		icon?: string;
		class?: ClassValue;
	};

	let { checked = $bindable(false), class: classProp, ...restProps }: Props = $props();
</script>

<button onclick={() => (checked = !checked)}>
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
</button>
