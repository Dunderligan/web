<script lang="ts">
	import { Accordion, type WithoutChildrenOrChild } from 'bits-ui';
	import AccordionItem from '$lib/components/ui/AccordionItem.svelte';

	type Item = {
		value?: string;
		title: string;
		content: string;
		disabled?: boolean;
	};

	type Props = WithoutChildrenOrChild<Accordion.RootProps> & {
		items: Item[];
	};

	let { value = $bindable(), ref = $bindable(null), items, ...restProps }: Props = $props();
</script>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- Expression produces a union type that is too complex to represent. (ts) -->
<Accordion.Root
	bind:value
	bind:ref
	class="flex w-full flex-col space-y-2 overflow-hidden rounded-lg text-gray-700 sm:max-w-[70%] dark:text-gray-300"
	{...restProps as any}
>
	{#each items as item, i (item.title + i)}
		<AccordionItem {...item} />
	{/each}
</Accordion.Root>
