<script lang="ts">
	import { flipSlot, matchRoster } from '$lib/match';
	import {
		type MapCatalogEntry,
		type HeroCatalogEntry,
		type GamemodeCatalogEntry,
		type MapOutcome,
		DecisionPoint
	} from '$lib/pick-ban';
	import { outcomeToSlot, pickedMapId, bannedHeroId } from '$lib/pick-ban/util';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import GamemodeBadge from '../ui/GamemodeBadge.svelte';
	import HeroPortrait from '../ui/HeroPortrait.svelte';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import StatusIndicator from '../ui/StatusIndicator.svelte';
	import type { HistoryEntry } from './PickBanHistory.svelte';
	import PickBanHistoryInfoRow from './PickBanHistoryInfoRow.svelte';

	type Props = {
		entry: HistoryEntry;
	};

	let { entry }: Props = $props();

	const context = PickBanContext.get();

	function mapById(id: string | null): MapCatalogEntry | null {
		if (!id) return null;
		return context.catalog.maps.find((map) => map.id === id) ?? null;
	}

	function heroById(id: string | null): HeroCatalogEntry | null {
		if (!id) return null;
		return context.catalog.heroes.find((hero) => hero.id === id) ?? null;
	}

	function gamemodeFor(map: MapCatalogEntry | null): GamemodeCatalogEntry | null {
		if (!map) return null;
		return context.gamemodes.find((gamemode) => gamemode.id === map.gamemodeId) ?? null;
	}

	function outcomeLabel(outcome: MapOutcome): string {
		const slot = outcomeToSlot(outcome);
		if (!slot) return 'Oavgjort';

		const roster = matchRoster(context.match, slot);
		return `Map win till ${roster?.name ?? 'okänt lag'}`;
	}
</script>

<div class="relative rounded-lg bg-gray-50 p-3 font-medium dark:bg-gray-900">
	<StatusIndicator
		kind="outlined"
		class="absolute top-1/2 -left-9 z-10 -translate-y-1/2"
		size="sm"
	/>

	<div class="absolute top-1/2 -left-2.5 size-4 -translate-y-3/4 text-gray-50 dark:bg-gray-900">
		<Icon icon="ph:caret-left-fill" />
	</div>

	<PickBanHistoryInfoRow {entry} />

	<div class="mt-2 flex items-center gap-3">
		{#if entry.kind === 'decision'}
			{#if entry.decision.point === DecisionPoint.MAP_PICK}
				{@const pickedMap = mapById(pickedMapId(entry.decision))}
				{@const gamemode = gamemodeFor(pickedMap)}

				{#if pickedMap && gamemode}
					<div class="pointer-events-none absolute inset-y-0 right-0 w-2/3" aria-hidden="true">
						<img
							src="/maps/{pickedMap.slug}.webp"
							alt=""
							class="size-full rounded-lg object-cover opacity-35"
						/>

						<div
							class="absolute inset-0 bg-linear-to-r from-gray-50 via-gray-50/50 to-transparent dark:from-gray-900 dark:via-gray-900/80"
						></div>
					</div>

					<div class="relative shrink-0">
						<img
							src="/maps/{pickedMap.slug}.webp"
							alt={pickedMap.name}
							class="h-20 rounded-md object-cover"
						/>

						<GamemodeBadge {gamemode} class="absolute -right-1 -bottom-1" />
					</div>

					<div>
						<span class="font-semibold">
							{pickedMap.name}
						</span>

						<span> pick </span>
					</div>
				{/if}
			{:else if entry.decision.point === DecisionPoint.FIRST_BAN || entry.decision.point === DecisionPoint.SECOND_BAN}
				{@const hero = heroById(bannedHeroId(entry.decision))}

				{#if hero}
					<div class="relative">
						<HeroPortrait {hero} size="sm" />

						<span
							class="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-red-100 text-red-800 shadow-sm"
						>
							<Icon icon="ph:prohibit" />
						</span>
					</div>

					<div>
						<span class="font-semibold">
							{hero.name}
						</span>

						<span>bannad </span>
					</div>
				{/if}
			{:else if entry.decision.point === DecisionPoint.BAN_ORDER}
				{@const conceded = 'concede' in entry.decision.value && entry.decision.value.concede}
				{@const firstBanSlot = flipSlot(entry.decision.slot, conceded)}
				{@const firstBanRoster = matchRoster(context.match, firstBanSlot)}

				{#if firstBanRoster}
					<RosterLogo id={firstBanRoster.id} size="md" />

					<div>
						<span class="font-semibold">
							{firstBanRoster.name}
						</span>

						<span> får första ban </span>
					</div>
				{/if}
			{/if}
		{:else}
			{@const winnerSlot = outcomeToSlot(entry.outcome)}
			{@const winnerRoster = winnerSlot ? matchRoster(context.match, winnerSlot) : null}

			{#if winnerRoster}
				<RosterLogo id={winnerRoster.id} size="md" />
			{:else}
				<div
					class="flex size-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800"
				>
					<Icon icon="ph:equals" class="text-xl" />
				</div>
			{/if}

			<span>
				{outcomeLabel(entry.outcome)}
			</span>
		{/if}
	</div>
</div>
