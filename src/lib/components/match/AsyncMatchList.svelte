<script lang="ts">
	import type { MatchListProps, ResolvedMatchWithContext } from '$lib/types';
	import MatchSkeleton from './MatchSkeleton.svelte';
	import MatchList from './MatchList.svelte';

	type Props = Omit<MatchListProps, 'matches' | 'title'> & {
		skeletonCount?: number;
		matches: Promise<ResolvedMatchWithContext[]>;
	};

	let {
		skeletonCount = 3,
		class: classProp,
		matches: matchPromise,
		...matchListProps
	}: Props = $props();
</script>

{#await matchPromise}
	<div class={[classProp, 'max-w-2xl space-y-2']}>
		{#each Array.from({ length: skeletonCount })}
			<MatchSkeleton />
		{/each}
	</div>
{:then matches}
	<MatchList {...matchListProps} {matches} class={classProp} />
{/await}
