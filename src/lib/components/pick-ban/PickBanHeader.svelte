<script lang="ts">
	import { MatchSlot } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { matchRoster } from '$lib/match';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<header
	class={[
		classProp,
		'grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border-[3px] border-gray-200 px-4 py-2 lg:grid-cols-[1fr_auto_1fr] lg:py-6'
	]}
>
	{@render slot({ slot: MatchSlot.A, class: 'flex-row-reverse text-right' })}

	<div class="text-center text-2xl font-semibold lg:text-6xl lg:font-bold">
		{context.matchProgress.teamAWins} — {context.matchProgress.teamBWins}
	</div>

	{@render slot({ slot: MatchSlot.B })}
</header>

{#snippet slot({ slot, class: classProp }: { slot: MatchSlot; class?: ClassValue })}
	{@const roster = matchRoster(context.match, slot)}
	<!-- {@const seed = slot === MatchSlot.A ? context.state.teamASeed : context.state.teamBSeed} -->

	<div class={[classProp, 'flex min-w-0 basis-0 items-center gap-2']}>
		{#if roster}
			<RosterLogo id={roster.id} size="md" />

			<div class="font-display text-xl font-medium lg:text-3xl lg:font-semibold">{roster.name}</div>
		{/if}
	</div>
{/snippet}
