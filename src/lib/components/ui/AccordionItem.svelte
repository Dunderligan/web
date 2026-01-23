<script lang="ts">
	import { Accordion, type WithoutChildrenOrChild } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import Icon from './Icon.svelte';

	type Props = WithoutChildrenOrChild<Accordion.ItemProps> & {
		title: string;
		content: string;
	};

	let { title, content, ...restProps }: Props = $props();
</script>

<Accordion.Item
	{...restProps}
	class="bg-gray-100 px-8  py-3 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800"
>
	<Accordion.Header>
		<Accordion.Trigger
			class="flex min-h-12 w-full flex-1 items-center justify-between text-left font-display text-xl font-semibold hover:underline [&[data-state=open]>span]:rotate-180"
		>
			<div>{title}</div>
			<span><Icon icon="ph:caret-down" /></span>
		</Accordion.Trigger>
	</Accordion.Header>
	<Accordion.Content forceMount={true} class="overflow-hidden text-sm tracking-[-0.01em]">
		{#snippet child({ props, open })}
			{#if open}
				<div {...props} transition:slide={{ duration: 400 }} class="pt-1 pb-2 text-lg">
					{content}
				</div>
			{/if}
		{/snippet}
	</Accordion.Content>
</Accordion.Item>
