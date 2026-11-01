<script lang="ts">
	import { Combobox } from 'bits-ui';
	import Icon from '../ui/Icon.svelte';
	import type { SelectItem } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		value: string | undefined;
		queryItems: (query: string) => Promise<SelectItem[]>;
		onValueChange?: (value: string | undefined) => void;
		placeholder?: string;
		noResultsText?: string;
		class?: ClassValue;
		debounce?: number;
		itemSnippet?: Snippet<[SelectItem]>;
	} & Omit<Combobox.RootProps, 'type' | 'items' | 'type' | 'value'>;

	let {
		value = $bindable(undefined),
		class: classProp,
		queryItems,
		debounce = 300,
		itemSnippet,
		...props
	}: Props = $props();

	let searchQuery = $state('');
	let items: SelectItem[] = $state([]);

	let loading = $state(false);
	let queryTimer: NodeJS.Timeout | null = null;

	$effect(() => {
		onTyped(searchQuery);
	});

	async function onTyped(searchQuery: string) {
		if (queryTimer) {
			clearTimeout(queryTimer);
		}

		if (searchQuery.length >= 2) {
			loading = true;

			queryTimer = setTimeout(async () => {
				items = await queryItems(searchQuery);
				loading = false;
			}, debounce);
		} else {
			items = [];
			loading = false;
		}
	}
</script>

<Combobox.Root type="single" bind:value {items} {...props}>
	<Combobox.Input
		class={[classProp, 'field grow']}
		oninput={(evt) => {
			value = undefined;
			searchQuery = evt.currentTarget.value;
		}}
		{...props}
	/>

	<Combobox.Portal>
		{#if searchQuery.length >= 2}
			<Combobox.Content class="floating w-(--bits-combobox-anchor-width)">
				{#if loading}
					<div class="py-2 text-center font-medium text-gray-500">
						<Icon icon="ph:spinner" class="animate-spin" />
					</div>
				{:else if items.length === 0}
					<div class="py-2 text-center font-medium text-gray-600 dark:text-gray-300">
						{props.noResultsText ?? 'Inga resultat hittades'}
					</div>
				{:else}
					{#each items as item (item.value)}
						<Combobox.Item {...item} class="floating-item my-0.5">
							{#if itemSnippet}
								{@render itemSnippet(item)}
							{:else}
								{item.label}
							{/if}
						</Combobox.Item>
					{/each}
				{/if}
			</Combobox.Content>
		{/if}
	</Combobox.Portal>
</Combobox.Root>
