<script lang="ts" generics="T">
	import { mapEmptyToUndefined } from '$lib/util';
	import { Select, type WithoutChildren } from 'bits-ui';

	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import { quadOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';

	type LabelDecoration =
		| {
				label?: never;
		  }
		| {
				placeholder?: never;
				label: string;
		  };

	type ItemDecoration =
		| {
				itemIcon?: (value: string) => string;
				itemSnippet?: never;
		  }
		| {
				itemIcon?: never;
				itemSnippet?: Snippet<[{ value: string }]>;
		  };

	type Props = WithoutChildren<Select.RootProps> & {
		placeholder?: string;
		items: { value: string; label: string; disabled?: boolean }[];
		triggerClass?: string;
		avoidCollisions?: boolean;
	} & LabelDecoration &
		ItemDecoration;

	let {
		open = $bindable(false),
		value = $bindable(),
		triggerClass,
		items,
		placeholder,
		avoidCollisions,
		label,
		itemIcon,
		itemSnippet,
		disabled,
		...restProps
	}: Props = $props();

	const selectedItem = $derived(
		restProps.type === 'single' ? items.find((item) => item.value === value) : null
	);

	const selectedLabel = $derived(
		restProps.type === 'single'
			? items.find((item) => item.value === value)?.label
			: mapEmptyToUndefined(
					items
						.filter((item) => value?.includes(item.value))
						.map((item) => item.label)
						.join(', ')
				)
	);
</script>

<Select.Root bind:value={value as never} bind:open {disabled} {...restProps}>
	<Select.Trigger
		class={[
			triggerClass,
			'group flex items-center overflow-hidden rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 data-[disabled]:cursor-not-allowed data-[disabled]:bg-gray-200 data-[disabled]:text-gray-500'
		]}
	>
		{#if selectedItem}
			{@render renderedItemIcon(selectedItem.value)}
		{/if}

		<div
			class={[
				label || selectedLabel ? 'text-primary-300' : 'text-primary-600',
				'group-disabled:text-primary-400 shrink grow truncate text-left'
			]}
		>
			{label ?? selectedLabel ?? placeholder}
		</div>

		<Icon icon="ph:caret-down" class={[open && 'rotate-180', 'ml-auto transform text-gray-600']} />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content forceMount {avoidCollisions}>
			{#snippet child({ wrapperProps, props, open })}
				<div {...wrapperProps}>
					{#if open}
						<div
							{...props}
							class="floating w-[var(--bits-select-anchor-width)]"
							in:fly={{ y: -5, duration: 80, easing: quadOut }}
						>
							<Select.Viewport>
								{#each items as item, i (i + item.value)}
									<Select.Item {...item} class="floating-item">
										{#snippet children({ selected })}
											{@render renderedItemIcon(item.value)}

											<span>{item.label}</span>

											{#if selected}
												<Icon icon="ph:check" class="ml-auto text-xs text-accent-400" />
											{/if}
										{/snippet}
									</Select.Item>
								{/each}
							</Select.Viewport>
						</div>
					{/if}
				</div>
			{/snippet}
		</Select.Content>
	</Select.Portal>
</Select.Root>

{#snippet renderedItemIcon(value: string)}
	{#if itemIcon}
		<Icon icon={itemIcon(value)} class="mr-2 shrink-0 text-lg" />
	{:else if itemSnippet}
		{@render itemSnippet({ value })}
	{/if}
{/snippet}
