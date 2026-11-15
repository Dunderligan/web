<script lang="ts" module>
	export type DecisionEntry = {
		kind: 'decision';
		key: string;
		at: Date;
		decision: RecordedDecision;
	};

	export type ResultEntry = {
		kind: 'result';
		key: string;
		at: Date | null;
		outcome: MapOutcome;
	};

	export type HistoryEntry = DecisionEntry | ResultEntry;

	export type MapHistory = {
		map: RoomMapState;
		entries: HistoryEntry[];
	};
</script>

<script lang="ts">
	import { MapOutcome, RoomStatus, type RecordedDecision, type RoomMapState } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import type { ClassValue } from 'svelte/elements';
	import StatusIndicator from '../ui/StatusIndicator.svelte';
	import PickBanHistoryEntry from './PickBanHistoryEntry.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const history = $derived.by<MapHistory[]>(() => {
		return [...context.state.maps]
			.sort((a, b) => b.index - a.index)
			.map((map) => {
				const entries: HistoryEntry[] = map.decisions.map((decision, index) => ({
					kind: 'decision',
					key: `decision-${map.index}-${decision.point}-${index}`,
					at: decision.createdAt,
					decision
				}));

				if (map.outcome !== null) {
					entries.push({
						kind: 'result',
						key: `result-${map.index}`,
						at: map.resultRecordedAt ?? map.reports[0]?.submittedAt ?? null,
						outcome: map.outcome
					});
				}

				entries.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));

				return { map, entries };
			});
	});

	function isCurrentMap(map: RoomMapState): boolean {
		return context.status === RoomStatus.IN_PROGRESS && map.index === context.state.currentMapIndex;
	}
</script>

<div class={[classProp, 'relative rounded-xl border-[3px] border-gray-200 bg-white p-6']}>
	<div
		class="absolute top-8 bottom-0 left-8.5 w-1 bg-gray-200 dark:bg-gray-700"
		aria-hidden="true"
	></div>

	<div class="space-y-8">
		{#each history as { map, entries } (map.index)}
			{@const current = isCurrentMap(map)}

			<section class="flex items-start gap-4">
				<StatusIndicator kind={current ? 'active' : 'inactive'} class="z-10 mt-0.5" />

				<div class="w-full space-y-3">
					<h3 class="text-lg font-semibold uppercase">Map {map.index + 1}</h3>

					{#each entries as entry (entry.key)}
						<PickBanHistoryEntry {entry} />
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
