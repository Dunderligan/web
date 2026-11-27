<script lang="ts">
	import {
		DecisionPoint,
		MapEligibility,
		computeMapEligibility,
		type MapCatalogEntry
	} from '#lib/pick-ban/index.ts';
	import { PickBanContext } from '#lib/state/pick-ban.svelte.ts';
	import { SvelteMap } from 'svelte/reactivity';
	import Tabs from '../ui/Tabs.svelte';
	import type { ClassValue } from 'svelte/elements';
	import { compare, gamemodeIcon } from '#lib/util.ts';

	type Props = {
		interactive?: boolean;
		class?: ClassValue;
	};

	let { interactive = true, class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const mapsByGamemode = $derived.by(() => {
		const eligibilityById = new Map(
			computeMapEligibility({
				catalog: context.catalog.maps,
				config: context.config,
				maps: context.state.maps
			}).map((map) => [map.item.id, map.eligibility])
		);

		const maps = new SvelteMap<string, (MapCatalogEntry & { eligibility: MapEligibility })[]>();

		for (const map of context.catalog.maps) {
			if (!maps.has(map.gamemodeId)) {
				maps.set(map.gamemodeId, []);
			}

			const eligibility = eligibilityById.get(map.id) ?? MapEligibility.ELIGIBLE;
			maps.get(map.gamemodeId)?.push({ ...map, eligibility });
		}

		return maps;
	});

	let selectedGamemodeId = $derived(
		context.gamemodes.find(
			(gamemode) => gamemode.active && gamemodeEligibility(gamemode.id) === MapEligibility.ELIGIBLE
		)?.id
	);

	const shownMaps = $derived.by(() => {
		const unsorted = selectedGamemodeId ? (mapsByGamemode.get(selectedGamemodeId) ?? []) : [];

		return unsorted.sort((a, b) => {
			return compare(a.eligibility, b.eligibility) || a.name.localeCompare(b.name);
		});
	});

	function gamemodeEligibility(gamemodeId: string): MapEligibility {
		const map = mapsByGamemode.get(gamemodeId);
		if (!map) return MapEligibility.ELIGIBLE;

		if (map.some((hero) => hero.eligibility === MapEligibility.ELIGIBLE)) {
			return MapEligibility.ELIGIBLE;
		}

		const ineligibilityReasons = new SvelteMap<MapEligibility, number>();
		for (const hero of map) {
			const current = ineligibilityReasons.get(hero.eligibility) ?? 0;
			ineligibilityReasons.set(hero.eligibility, current + 1);
		}

		const topReason = [...ineligibilityReasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
		return topReason ?? MapEligibility.ELIGIBLE;
	}

	async function selectMap(mapId: string) {
		if (!interactive) return;

		await context.makeDecision({
			point: DecisionPoint.MAP_PICK,
			mapId
		});
	}

	function formatEligibility(eligibility: MapEligibility): string {
		switch (eligibility) {
			case MapEligibility.ELIGIBLE:
				return 'Väljbar';
			case MapEligibility.ALREADY_PICKED:
				return 'Redan vald i den här matchen';
			case MapEligibility.INACTIVE:
				return 'Inaktiv';
			case MapEligibility.INVALID_FIRST_GAMEMODE:
				return 'Spelläget är inte tillåtet som första karta';
			case MapEligibility.POOL_GAMEMODE_RESTRICTION:
				return 'Spelläget tillåts inte av kartpoolen';
			case MapEligibility.POOL_RESTRICTION:
				return 'Kartan tillåts inte i den här matchen';
			case MapEligibility.USED_GAMEMODE:
				return 'Spelläget har redan använts i den här matchen';
		}
	}
</script>

<div class={[classProp, 'w-full']}>
	<Tabs
		class="w-full"
		bind:selected={selectedGamemodeId}
		items={context.gamemodes
			.filter((gamemode) => gamemode.active)
			.map((gamemode) => {
				const eligibility = gamemodeEligibility(gamemode.id);
				const disabled = eligibility !== MapEligibility.ELIGIBLE;

				return {
					label: gamemode.name,
					value: gamemode.id,
					disabled,
					icon: gamemodeIcon(gamemode.slug),
					title: disabled ? formatEligibility(eligibility) : undefined
				};
			})
			.toSorted((a, b) => a.label.localeCompare(b.label))}
	/>

	<div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
		{#each shownMaps as { eligibility, ...map } (map.id)}
			{#if eligibility !== MapEligibility.POOL_RESTRICTION}
				<button
					class="overflow-hidden rounded-lg bg-gray-100 not-disabled:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-900 dark:not-disabled:hover:bg-gray-800"
					onclick={() => selectMap(map.id)}
					disabled={!interactive || eligibility !== MapEligibility.ELIGIBLE}
					{...eligibility !== MapEligibility.ELIGIBLE
						? { title: formatEligibility(eligibility) }
						: {}}
				>
					<img src="/maps/{map.slug}.webp" alt={map.name} class="h-24 w-full object-cover" />

					<div class="py-1.5">
						{map.name}
					</div>
				</button>
			{/if}
		{/each}
	</div>
</div>
