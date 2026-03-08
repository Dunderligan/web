<script lang="ts">
	import Match from './Match.svelte';
	import Subheading from '../ui/Subheading.svelte';
	import MatchListPlaceholder from './MatchListPlaceholder.svelte';
	import type { MatchListProps } from '$lib/types';

	let {
		seasonSlug,
		mainRosterId,
		matches,
		hideIfEmpty = false,
		hideDivision = false,
		title,
		button,
		class: classProp,
		short = false
	}: MatchListProps = $props();

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
			<Match {match} {seasonSlug} {hideDivision} {mainRosterId} {short} />
		{:else}
			<MatchListPlaceholder />
		{/each}
	</div>

	<div class="mt-2 flex max-w-2xl items-center justify-end">
		{@render button?.()}
	</div>
{/if}
