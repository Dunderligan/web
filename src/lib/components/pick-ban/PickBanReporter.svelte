<script lang="ts">
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import type { ClassValue } from 'svelte/elements';
	import Subheading from '../ui/Subheading.svelte';
	import { matchRoster, matchSlots } from '$lib/match';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Button from '../ui/Button.svelte';
	import { MapOutcome, RoomMapReportState } from '$lib/pick-ban';
	import { slotToOutcome } from '$lib/pick-ban/util';
	import Waiting from './Waiting.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const MAP_LENGTH_THRESHOLD = 1000 * 3; // 3 minutes;

	const decisionsCompletedAt = $derived(context.currentMap?.decisionsCompletedAt);
	const timeSinceMapStart = $derived(
		context.now.getTime() - (decisionsCompletedAt?.getTime() ?? 0)
	);

	const reportState = $derived(context.currentMap?.reportState);
	const teamHasSubmitted = $derived(
		context.currentMap?.reports.some((report) => report.slot === context.userSlot)
	);
</script>

{#snippet description(text: string)}
	<p class="mt-2 text-lg font-medium">
		{text}
	</p>
{/snippet}

<div class={[classProp, 'w-full max-w-md']}>
	{#if reportState === RoomMapReportState.PENDING}
		{#if timeSinceMapStart < MAP_LENGTH_THRESHOLD}
			<Subheading>Dags att spela!</Subheading>

			{#if context.userIsCaptain}
				{@render description(
					'Kom tillbaka hit efter kartan för att rapportera resultatet. Lycka till!'
				)}
			{/if}
		{:else if context.userIsParticipant && teamHasSubmitted}
			<Waiting text="Väntar på att motståndarlaget ska rapportera sitt resultat..." />
		{:else if context.userIsCaptain}
			<Subheading>Rapportera resultat</Subheading>

			<div class={[classProp, 'mt-4 flex w-full max-w-md flex-col gap-1 overflow-hidden']}>
				{#each matchSlots() as slot (slot)}
					{@const roster = matchRoster(context.match, slot)}

					{#if roster}
						<Button
							class="justify-start text-lg"
							kind="secondary"
							onclick={() => context.submitReport(slotToOutcome(slot))}
						>
							<RosterLogo id={roster.id} size="md" />
							<span class="font-semibold">
								Vinst till {roster.name}
							</span>
						</Button>
					{/if}
				{/each}

				<Button
					kind="tertiary"
					icon="ph:handshake"
					label="Oavgjort"
					onclick={() => context.submitReport(MapOutcome.DRAW)}
				/>
			</div>
		{:else}
			<Waiting text="Väntar på att lagen ska rapportera resultatet..." />
		{/if}
	{:else if reportState === RoomMapReportState.AGREED}
		<Subheading>Resultat rapporterat</Subheading>

		{@render description('Resultatet har rapporterats och godkänts av båda lagen.')}
	{:else if reportState === RoomMapReportState.DISPUTED}
		<Subheading>Resultatet är under diskussion</Subheading>

		{@render description(
			'Resultatet har rapporterats men inte godkänts av båda lagen. Diskutera med motståndarlaget för att komma överens om resultatet.'
		)}
	{:else if reportState === RoomMapReportState.RESOLVED}
		<Subheading>Resultatet har fastställts</Subheading>

		{@render description('Resultatet har fastställts av en administratör.')}
	{/if}
</div>
