import { MatchSlot } from '$lib/types';
import type { ResolvedPickBanConfig } from './config';
import {
	DecisionPoint,
	PickBanMapType,
	type HeroCatalogEntry,
	type MapCatalogEntry,
	type RoomMapState
} from './types';
import { decisionAt } from './util';

export type MapEligibilityInput = {
	config: ResolvedPickBanConfig;
	/** All maps in the room, including the current one as the last element. */
	maps: readonly RoomMapState[];
	/** The full map catalogue, including inactive entries. */
	catalog: readonly MapCatalogEntry[];
};

export type HeroEligibilityInput = {
	/** All maps in the room, including the current one as the last element. */
	maps: readonly RoomMapState[];
	/** The team whose eligible heroes are requested. */
	slot: MatchSlot;
	/** The full hero catalogue. */
	catalog: readonly HeroCatalogEntry[];
};

/**
 * Returns the maps that the first-ban team may pick for the current map, in catalogue order.
 *
 * Rules applied:
 * - only active maps are eligible;
 * - the configured allowed-map subset applies when enabled;
 * - the first map may be restricted to a fixed gamemode;
 * - a map that was already picked in the match is never eligible again;
 * - when gamemode restriction is enabled, maps in gamemodes already used in the current cycle
 *   are unavailable, unless every gamemode in the pool has been used, in which case the pool
 *   refreshes and all gamemodes become available again.
 */
export function eligibleMaps(input: MapEligibilityInput): MapCatalogEntry[] {
	const { config, maps, catalog } = input;
	const mapIndex = Math.max(maps.length - 1, 0);

	let pool = catalog.filter((entry) => entry.active);

	if (config.allowedMapIds) {
		const allowed = new Set(config.allowedMapIds);
		pool = pool.filter((entry) => allowed.has(entry.id));
	}

	if (config.allowedGamemodeIds) {
		const allowed = new Set(config.allowedGamemodeIds);
		pool = pool.filter((entry) => allowed.has(entry.gamemodeId));
	}

	if (mapIndex === 0 && config.firstGamemodeId) {
		pool = pool.filter((entry) => entry.gamemodeId === config.firstGamemodeId);
	}

	const pickedMapIds = new Set(
		maps.map((map) => map.mapId).filter((mapId): mapId is string => mapId !== null)
	);

	let candidates = pool.filter((entry) => !pickedMapIds.has(entry.id));

	if (config.restrictUsedGamemodes) {
		const poolGamemodes = new Set(pool.map((entry) => entry.gamemodeId));
		const used = usedGamemodesSinceRefresh(maps.slice(0, -1), catalog, poolGamemodes);

		// Once every gamemode in the pool has been used, the cycle resets. `used` is empty in
		// that case, so no gamemode is filtered out.
		candidates = candidates.filter((entry) => !used.has(entry.gamemodeId));
	}

	return candidates;
}

/**
 * Returns the gamemodes used since the most recent pool refresh.
 *
 * History is scanned in order. Every time all gamemodes in `poolGamemodeIds` have appeared,
 * the cycle resets. Maps outside the pool do not affect the cycle.
 */
export function usedGamemodesSinceRefresh(
	history: readonly RoomMapState[],
	catalog: readonly MapCatalogEntry[],
	poolGamemodeIds: ReadonlySet<string>
): Set<string> {
	const used = new Set<string>();
	if (poolGamemodeIds.size === 0) return used;

	const mapsById = new Map(catalog.map((entry) => [entry.id, entry]));

	for (const map of history) {
		if (!map.mapId) continue;

		const entry = mapsById.get(map.mapId);
		if (!entry || !poolGamemodeIds.has(entry.gamemodeId)) continue;

		used.add(entry.gamemodeId);
		if (used.size === poolGamemodeIds.size) {
			used.clear();
		}
	}

	return used;
}

/**
 * Returns the predetermined map for a game index when a fixed map pool is configured.
 * Throws when the configuration or catalogue cannot supply a map, since that is a room-level
 * misconfiguration rather than a team decision.
 */
export function fixedMapForGame(
	config: ResolvedPickBanConfig,
	mapIndex: number,
	catalog: readonly MapCatalogEntry[]
): MapCatalogEntry {
	if (config.mapType !== PickBanMapType.FIXED || !config.fixedMapIds) {
		throw new Error('The map pool is not fixed');
	}

	const mapId = config.fixedMapIds[mapIndex % config.fixedMapIds.length];

	const entry = catalog.find((map) => map.id === mapId);
	if (!entry) {
		throw new Error(`The fixed map ${mapId} is not in the map catalogue`);
	}
	if (!entry.active) {
		throw new Error(`The fixed map ${entry.slug} is inactive`);
	}

	return entry;
}

/**
 * Returns the heroes that `slot` may ban next, in catalogue order.
 *
 * Rules applied:
 * - a team may not ban a hero it banned on an earlier map;
 * - a team may ban a hero the opposing team banned on an earlier map;
 * - the second ban on a map must be a different role from the first ban;
 * - heroes already banned on the current map are never eligible again.
 */
export function eligibleHeroes(input: HeroEligibilityInput): HeroCatalogEntry[] {
	const { maps, slot, catalog } = input;
	const currentMap = maps[maps.length - 1];
	if (!currentMap) return [...catalog];

	const ownBannedHeroIds = new Set<string>();
	const currentBannedHeroIds = new Set<string>();

	for (const map of maps) {
		const isCurrent = map.index === currentMap.index;

		for (const decision of map.decisions) {
			if (
				decision.point !== DecisionPoint.FIRST_BAN &&
				decision.point !== DecisionPoint.SECOND_BAN
			) {
				continue;
			}
			if (!('heroId' in decision.value)) continue;

			if (isCurrent) currentBannedHeroIds.add(decision.value.heroId);
			if (decision.slot === slot) ownBannedHeroIds.add(decision.value.heroId);
		}
	}

	const firstBan = decisionAt(currentMap, DecisionPoint.FIRST_BAN);
	const firstBanHeroId = firstBan && 'heroId' in firstBan.value ? firstBan.value.heroId : null;
	const firstBanRole =
		firstBanHeroId === null
			? null
			: (catalog.find((hero) => hero.id === firstBanHeroId)?.role ?? null);

	return catalog.filter((hero) => {
		if (ownBannedHeroIds.has(hero.id)) return false;
		if (currentBannedHeroIds.has(hero.id)) return false;
		// The first ban is unrestricted. The second ban must differ in role.
		if (firstBanRole !== null && hero.role === firstBanRole) return false;
		return true;
	});
}
