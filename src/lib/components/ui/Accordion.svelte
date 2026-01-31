<script lang="ts">
	import { Accordion, type WithoutChildrenOrChild } from 'bits-ui';
	import AccordionItem from '$lib/components/ui/AccordionItem.svelte';

	type Item = {
		value?: string;
		title: string;
		content: string;
		disabled?: boolean;
	};

	let {
		value = $bindable(),
		ref = $bindable(null),
		items,
		...restProps
	}: WithoutChildrenOrChild<Accordion.RootProps> & {
		items: Item[];
	} = $props();
</script>

<Accordion.Root
	bind:value
	bind:ref
	{...restProps as any}
	class="flex w-full flex-col space-y-2 overflow-hidden rounded-lg text-gray-700 sm:max-w-[70%] dark:text-gray-300"
>
	{#each items as item, i (item.title + i)}
		<AccordionItem {...item} />
	{/each}
</Accordion.Root>
