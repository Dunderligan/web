<script lang="ts">
	import Match from './Match.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import MatchListPlaceholder from './MatchListPlaceholder.svelte';
	import Button from '../ui/Button.svelte';
	import { page } from '$app/state';
	import type { ClassValue } from 'svelte/elements';
	import type { ResolvedMatchWithContext } from '$lib/types';
	import type { ComponentProps } from 'svelte';

	type Props = {
		hideIfEmpty?: boolean;
		title?: string;
		class?: ClassValue;
		matchArchiveParams?: string;
		matches: ResolvedMatchWithContext[];
	} & Omit<ComponentProps<typeof Match>, 'match'>;

	let {
		matches,
		hideIfEmpty = false,
		title,
		class: classProp,
		matchArchiveParams,
		...matchProps
	}: Props = $props();

	const hide = $derived(hideIfEmpty && matches.length === 0);
</script>

{#if !hide}
	{#if title}
		<Subheading class={[classProp, 'mb-4']}>
			{title}
		</Subheading>
	{/if}

	<div class={[!title && classProp, 'max-w-2xl space-y-2']}>
		{#each matches as match (match.id)}
			<Match {match} {...matchProps} />
		{:else}
			<MatchListPlaceholder />
		{/each}
	</div>

	{#if matches.length > 0 && matchArchiveParams}
		<div class="mt-2 flex max-w-2xl items-center justify-end">
			<Button
				kind="secondary"
				href="/arkiv/matcher?prev={page.url.pathname}&{matchArchiveParams}"
				icon="ph:arrow-right"
				label="Se alla"
			/>
		</div>
	{/if}
{/if}
