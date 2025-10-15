<script lang="ts" generics="T">
	import { mapEmptyToUndefined } from '$lib/util';
	import { Select, type WithoutChildren } from 'bits-ui';

	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import { quadOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';

	type Props = WithoutChildren<Select.RootProps> & {
		placeholder?: string;
		items: { value: string; label: string; disabled?: boolean }[];
		triggerClass?: string;
		avoidCollisions?: boolean;
	} & (
			| {
					label?: never;
			  }
			| {
					placeholder?: never;
					label: string;
			  }
		) &
		(
			| {
					itemIcon?: (value: string) => string;
					itemSnippet?: never;
			  }
			| {
					itemIcon?: never;
					itemSnippet?: Snippet<[{ value: string }]>;
			  }
		);

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

<Select.Root bind:value={value as never} bind:open {...restProps}>
	<Select.Trigger
		class={[
			triggerClass,
			'group flex items-center overflow-hidden rounded-lg border border-transparent bg-gray-100 py-2 pr-2 pl-4 font-medium text-gray-800'
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

		<Icon
			icon="mdi:arrow-down-drop"
			class={[open && 'rotate-180', 'ml-auto transform text-xl text-gray-400']}
		/>
	</Select.Trigger>
	<Select.Portal>
		<Select.Content forceMount {avoidCollisions}>
			{#snippet child({ wrapperProps, props, open })}
				<div {...wrapperProps}>
					{#if open}
						<div
							{...props}
							class="z-50 w-[var(--bits-select-anchor-width)] min-w-40 rounded-lg border border-gray-200 bg-white p-1.5 shadow-md"
							in:fly={{ y: -5, duration: 80, easing: quadOut }}
						>
							<Select.Viewport>
								{#each items as item, i (i + item.value)}
									<Select.Item
										{...item}
										class={[
											item.value === value
												? 'font-medium text-gray-600'
												: 'font-medium text-gray-500 hover:text-gray-600',
											'flex cursor-pointer items-center rounded-md px-4 py-1.5 text-left hover:bg-gray-100'
										]}
									>
										{#snippet children({ selected })}
											{@render renderedItemIcon(item.value)}

											<span>{item.label}</span>

											{#if selected}
												<Icon icon="mdi:circle" class="ml-auto text-xs text-accent-400" />
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
