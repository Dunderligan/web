<script lang="ts">
	import type { ResolvedMatchWithContext } from '$lib/types';
	import Match from './Match.svelte';
	import MatchSkeleton from './MatchSkeleton.svelte';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		seasonSlug?: string;
		mainRosterId?: string;
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

	let { seasonSlug, mainRosterId, matches, skeletonCount = 3 }: Props = $props();
</script>

<div class="max-w-2xl space-y-2">
	{#if Array.isArray(matches)}
		{@render matchList(matches)}
	{:else}
		{#await matches}
			{#each Array.from({ length: skeletonCount })}
				<MatchSkeleton />
			{/each}
		{:then matches}
			{@render matchList(matches)}
		{/await}
	{/if}
</div>

{#snippet matchList(matches: ResolvedMatchWithContext[])}
	{#each matches as match (match.id)}
		<Match {match} {seasonSlug} flipped={mainRosterId === match.rosterB?.id} />
	{:else}
		<div
			class="text-center py-10 text-gray-700 space-y-2 bg-gray-100 rounded-lg dark:text-gray-300 dark:bg-gray-900"
		>
			<Icon icon="ph:ghost" class="text-5xl block mx-auto" />
			<span class="text-xl font-semibold">Inga matcher hittades</span>
		</div>
	{/each}
{/snippet}
