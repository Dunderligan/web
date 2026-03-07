<script lang="ts">
	import type { ClassValue, ResolvedMatchWithContext } from '$lib/types';
	import Match from './Match.svelte';
	import MatchSkeleton from './MatchSkeleton.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import MatchListPlaceholder from './MatchListPlaceholder.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		seasonSlug?: string;
		mainRosterId?: string;
		hideIfEmpty?: boolean;
		hideDivision?: boolean;
		title?: string;
		button?: Snippet;
		class?: ClassValue;
		short?: boolean;
	} & (
		| {
				matches: ResolvedMatchWithContext[];
				skeletonCount?: never;
		  }
		| {
				matches: Promise<ResolvedMatchWithContext[]>;
				skeletonCount?: number;
		  }
	);

	let {
		seasonSlug,
		mainRosterId,
		matches,
		skeletonCount = 3,
		hideIfEmpty = false,
		hideDivision = false,
		title,
		button,
		class: classProp,
		short = false
	}: Props = $props();

	const matchPromise = $derived(Array.isArray(matches) ? Promise.resolve(matches) : matches);
	const hide = $derived(hideIfEmpty && !matchPromise.then((m) => m.length > 0));
</script>

{#await matchPromise}
	{@render heading()}

	<div class={[!title && classProp, 'max-w-2xl space-y-2']}>
		{#each Array.from({ length: skeletonCount })}
			<MatchSkeleton />
		{/each}
	</div>
{:then matches}
	{#if !hide}
		{@render heading()}

		<div class={[!title && classProp, 'max-w-2xl space-y-2']}>
			{#each matches as match (match.id)}
				<Match {match} {seasonSlug} {hideDivision} {mainRosterId} {short} />
			{:else}
				<MatchListPlaceholder />
			{/each}
		</div>
	{/if}
{/await}

{#if !hide}
	<div class="mt-2 flex max-w-2xl items-center justify-end">
		{@render button?.()}
	</div>
{/if}

{#snippet heading()}
	{#if title}
		<Subheading class={[classProp, 'mb-4']}>
			{title}
		</Subheading>
	{/if}
{/snippet}
