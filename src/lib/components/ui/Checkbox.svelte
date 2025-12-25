<script lang="ts">
	import { Checkbox, type WithoutChildrenOrChild } from 'bits-ui';
	import Icon from './Icon.svelte';

	type Props = {} & WithoutChildrenOrChild<Checkbox.RootProps>;

	let { checked = $bindable(false), class: classProp, ...props }: Props = $props();
</script>

<Checkbox.Root
	bind:checked
	class={[
		classProp,
		checked
			? 'border-transparent bg-accent-600 data-disabled:bg-gray-400 data-enabled:hover:bg-accent-700 dark:data-disabled:bg-gray-600'
			: 'border-gray-300 bg-gray-100 hover:bg-gray-50 data-disabled:bg-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700',
		'flex size-7 items-center justify-center rounded-md border text-gray-200 data-disabled:cursor-not-allowed'
	]}
	{...props}
>
	{#if checked}
		<Icon icon="ph:check" />
	{/if}
</Checkbox.Root>
