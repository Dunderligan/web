<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import AdminEmptyNotice from './AdminEmptyNotice.svelte';
	import AdminLink from './AdminLink.svelte';
	import Button from '../ui/Button.svelte';
	import { isAdmin } from '$lib/authRole';
	import { page } from '$app/state';

	type Props<T> = {
		items: T[];
		linkHref: (item: T) => string;
		linkLabel?: (item: T) => string;
		linkContent?: Snippet<[{ item: T }]>;
		emptyText: string;
		oncreateclick?: () => void;
		createButtonLabel?: string;
		createButtonIcon?: string;
	};

	let {
		items,
		linkHref,
		linkLabel,
		linkContent,
		oncreateclick,
		emptyText,
		...emptyNoticeProps
	}: Props<T> = $props();

	const hideCreateButton = $derived(!isAdmin(page.data.user?.role));
</script>

{#if items.length === 0}
	<AdminEmptyNotice {oncreateclick} {...emptyNoticeProps} {hideCreateButton}>
		{emptyText}
	</AdminEmptyNotice>
{:else}
	<div class="space-y-1 overflow-hidden rounded-lg">
		{#each items as item}
			<AdminLink href={linkHref(item)}>
				{#if linkContent}
					{@render linkContent({ item })}
				{:else}
					{linkLabel?.(item) ?? String(item)}
				{/if}
			</AdminLink>
		{/each}
	</div>

	{#if !hideCreateButton}
		<Button icon="ph:plus" onclick={oncreateclick} />
	{/if}
{/if}
