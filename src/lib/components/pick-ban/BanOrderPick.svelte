<script lang="ts">
	import { matchRoster, matchSlots } from '$lib/match';
	import { DecisionPoint } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MatchSlot } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import Button from '../ui/Button.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		interactive?: boolean;
		class?: ClassValue;
	};

	let { interactive = true, class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const topSlot = $derived(context.userSlot);

	async function pick(slot: MatchSlot) {
		if (!interactive) return;

		const concede = slot !== context.userSlot;
		await context.makeDecision({
			point: DecisionPoint.BAN_ORDER,
			concede
		});
	}
</script>

<div
	class={[
		classProp,
		// make the preferred slot appear on top
		topSlot === MatchSlot.B ? 'flex-col-reverse' : 'flex-col',
		'flex w-full max-w-md gap-1 overflow-hidden'
	]}
>
	{#each matchSlots() as slot (slot)}
		{@const roster = matchRoster(context.match, slot)}

		{#if roster}
			<Button
				disabled={!interactive}
				class="justify-start text-lg"
				kind={topSlot && topSlot !== slot ? 'tertiary' : 'secondary'}
				onclick={() => void pick(slot)}
			>
				<RosterLogo id={roster.id} size="md" />
				<span class="font-semibold">
					{roster.name}
				</span>
			</Button>
		{/if}
	{/each}
</div>
