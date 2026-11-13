<script lang="ts">
	import { DecisionPoint, eligibleMaps, type MapCatalogEntry } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import Tabs from '../ui/Tabs.svelte';
	import type { ClassValue } from 'svelte/elements';
	import { compare } from '$lib/util';

	type Props = {
		interactive?: boolean;
		class?: ClassValue;
	};

	let { interactive = true, class: classProp }: Props = $props();

	const context = PickBanContext.get();

	const mapsByGamemode = $derived.by(() => {
		const eligibleIds = new Set(
			eligibleMaps({
				catalog: context.catalog.maps,
				config: context.config,
				maps: context.state.maps
			}).map((map) => map.id)
		);

		const maps = new SvelteMap<string, (MapCatalogEntry & { eligible: boolean })[]>();

		for (const map of context.catalog.maps) {
			if (!maps.has(map.gamemodeId)) {
				maps.set(map.gamemodeId, []);
			}

			const eligible = eligibleIds.has(map.id);
			maps.get(map.gamemodeId)?.push({ ...map, eligible });
		}

		return maps;
	});

	let selectedGamemodeId = $derived(
		context.gamemodes.find((gamemode) => gamemode.active && gamemodeHasEligibleMaps(gamemode.id))
			?.id
	);

	const shownMaps = $derived.by(() => {
		const unsorted = selectedGamemodeId ? (mapsByGamemode.get(selectedGamemodeId) ?? []) : [];

		return unsorted.sort((a, b) => {
			return compare(a.eligible, b.eligible) || a.name.localeCompare(b.name);
		});
	});

	function gamemodeHasEligibleMaps(gamemodeId: string): boolean {
		const maps = mapsByGamemode.get(gamemodeId);
		return maps?.some((map) => map.eligible) ?? false;
	}

	async function selectMap(mapId: string) {
		if (!interactive) return;

		await context.makeDecision({
			point: DecisionPoint.MAP_PICK,
			mapId
		});
	}
</script>

<div class={[classProp, 'w-full']}>
	<Tabs
		class="w-full"
		bind:selected={selectedGamemodeId}
		items={context.gamemodes
			.filter((gamemode) => gamemode.active)
			.map((gamemode) => ({
				label: gamemode.name,
				value: gamemode.id,
				disabled: !mapsByGamemode.get(gamemode.id)?.some((map) => map.eligible)
			}))
			.toSorted((a, b) => a.label.localeCompare(b.label))}
	/>

	<div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
		{#each shownMaps as { eligible, ...map } (map.id)}
			<button
				class="overflow-hidden rounded-lg bg-gray-100 not-disabled:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-80"
				disabled={!interactive || !eligible}
				onclick={() => selectMap(map.id)}
			>
				<img src="/maps/{map.slug}.webp" alt={map.name} class="h-24 w-full object-cover" />

				<div class="py-1.5">
					{map.name}
				</div>
			</button>
		{/each}
	</div>
</div>
