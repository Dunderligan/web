<script lang="ts">
	import { matchProgress, type ResolvedPickBanConfig, type RoomState } from '$lib/pick-ban';
	import { MatchSlot, type ResolvedMatchWithContext } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import { matchRoster } from '$lib/match';

	type Props = {
		state: RoomState;
		config: ResolvedPickBanConfig;
		match: ResolvedMatchWithContext;
		class?: ClassValue;
	};

	let { state, match, config, class: classProp }: Props = $props();

	const progress = $derived(matchProgress(config, state.maps));
</script>

<header
	class={[
		classProp,
		'grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border-[3px] border-gray-200 p-6'
	]}
>
	{@render slot({ slot: MatchSlot.A, class: 'flex-row-reverse text-right' })}

	<div class="text-6xl font-bold">
		{progress.teamAWins} — {progress.teamBWins}
	</div>

	{@render slot({ slot: MatchSlot.B })}
</header>

{#snippet slot({ slot, class: classProp }: { slot: MatchSlot; class?: ClassValue })}
	{@const roster = matchRoster(match, slot)}
	{@const seed = slot === MatchSlot.A ? state.teamASeed : state.teamBSeed}

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
