<script lang="ts">
	import type { ClassValue, ResolvedMatchWithContext } from '$lib/types';
	import Match from './Match.svelte';
	import MatchSkeleton from './MatchSkeleton.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import MatchListPlaceholder from './MatchListPlaceholder.svelte';

	type Props = {
		seasonSlug?: string;
		mainRosterId?: string;
		hideIfEmpty?: boolean;
		hideDivision?: boolean;
		title?: string;
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
		class: classProp,
		short = false
	}: Props = $props();

	const matchPromise = $derived(Array.isArray(matches) ? Promise.resolve(matches) : matches);
</script>

{#await matchPromise}
	{@render heading()}

	<div class={[!title && classProp, 'max-w-2xl space-y-2']}>
		{#each Array.from({ length: skeletonCount })}
			<MatchSkeleton />
		{/each}
	</div>
{:then matches}
	{#if !hideIfEmpty || matches.length > 0}
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

{#snippet heading()}
	{#if title}
		<Subheading class={[classProp, 'mb-4']}>{title}</Subheading>
	{/if}
{/snippet}
