<script lang="ts">
	import { MatchSlot } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { matchRoster } from '$lib/match';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import Link from '../ui/Link.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<header
	class={[
		classProp,
		'grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border-[3px] border-gray-200 px-4 py-2 lg:py-4 dark:border-gray-900'
	]}
>
	{@render slot({ slot: MatchSlot.A, class: 'flex-row-reverse text-right' })}

	<div class="shrink-0 text-center text-2xl font-semibold lg:text-6xl lg:font-bold">
		{context.matchProgress.teamAWins} — {context.matchProgress.teamBWins}
	</div>

	{@render slot({ slot: MatchSlot.B })}
</header>

{#snippet slot({ slot, class: classProp }: { slot: MatchSlot; class?: ClassValue })}
	{@const roster = matchRoster(context.match, slot)}
	{@const md = new MediaQuery('min-width: 1024px')}

	<div class={[classProp, 'flex items-center gap-2 not-lg:justify-end']}>
		{#if roster}
			{@const href = resolve(`/lag/${roster.slug}/${context.seasonSlug}`)}

			{#if md.current}
				<RosterLogo id={roster.id} size="xl" />
			{:else}
				<RosterLogo id={roster.id} size="md" />
			{/if}

			<Link {href} class="font-display text-xl font-medium lg:text-3xl lg:font-semibold"
				>{roster.name}</Link
			>
		{/if}
	</div>
{/snippet}
