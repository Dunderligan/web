<script lang="ts">
	import type { ResolvedMatchWithContext } from '$lib/types';
	import Match from './Match.svelte';
	import MatchSkeleton from './MatchSkeleton.svelte';
	import Icon from '../ui/Icon.svelte';
	import Subheading from '../ui/Subheading.svelte';

	type Props = {
		seasonSlug?: string;
		mainRosterId?: string;
		hideIfEmpty?: boolean;
		hideDivision?: boolean;
		title?: string;
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
		title
	}: Props = $props();

	const matchPromise = $derived(Array.isArray(matches) ? Promise.resolve(matches) : matches);
</script>

{#await matchPromise}
	{@render heading()}

	{#each Array.from({ length: skeletonCount })}
		<MatchSkeleton />
	{/each}
{:then matches}
	{#if !hideIfEmpty || matches.length > 0}
		{@render heading()}

		<div class="max-w-2xl space-y-2">
			{#each matches as match (match.id)}
				<Match {match} {seasonSlug} {hideDivision} {mainRosterId} />
			{:else}
				<div
					class="text-center py-10 text-gray-700 space-y-2 bg-gray-100 rounded-lg dark:text-gray-300 dark:bg-gray-900"
				>
					<Icon icon="ph:ghost" class="text-5xl block mx-auto" />
					<span class="text-xl font-semibold">Inga matcher hittades</span>
				</div>
			{/each}
		</div>
	{/if}
{/await}

{#snippet heading()}
	{#if title}
		<Subheading class="mt-10 mb-4">{title}</Subheading>
	{/if}
{/snippet}
