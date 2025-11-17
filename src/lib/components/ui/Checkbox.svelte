<script lang="ts">
	import { Checkbox, type WithoutChildrenOrChild } from 'bits-ui';
	import Icon from './Icon.svelte';

	type Props = {} & WithoutChildrenOrChild<Checkbox.RootProps>;

	let { checked = $bindable(), class: classProp }: Props = $props();
</script>

<Checkbox.Root
	bind:checked
	class={[
		classProp,
		checked
			? 'border-transparent bg-accent-600 hover:bg-accent-700'
			: 'border-gray-300 bg-gray-100 hover:bg-gray-50',
		'flex size-7 items-center justify-center rounded-md border text-gray-200 transition-colors duration-75'
	]}
>
	{#if checked}
		<Icon icon="ph:check" />
	{/if}
</Checkbox.Root>
