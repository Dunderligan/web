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
		'grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border-[3px] border-gray-200 p-6'
	]}
>
	{@render slot({ slot: MatchSlot.A, class: 'flex-row-reverse text-right' })}

	<div class="text-6xl font-bold">
		{context.matchProgress.teamAWins} — {context.matchProgress.teamBWins}
	</div>

	{@render slot({ slot: MatchSlot.B })}
</header>

{#snippet slot({ slot, class: classProp }: { slot: MatchSlot; class?: ClassValue })}
	{@const roster = matchRoster(context.match, slot)}
	{@const seed = slot === MatchSlot.A ? context.state.teamASeed : context.state.teamBSeed}

	<div class={[classProp, 'flex items-center gap-2']}>
		{#if roster}
			<RosterLogo id={roster.id} size="xl" class="row-start-1 row-end-2" />

			<div>
				<div class="font-display text-3xl font-semibold">{roster.name}</div>
				<div class="text-lg font-medium text-gray-700 dark:text-gray-300">Seed {seed}</div>
			</div>
		{/if}
	</div>
{/snippet}
