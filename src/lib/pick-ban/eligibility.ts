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
	maps: readonly RoomMapState[];
	catalog: readonly MapCatalogEntry[];
};

export type MapEligibilityResult = {
	item: MapCatalogEntry;
	eligibility: MapEligibility;
}[];

export enum MapEligibility {
	ELIGIBLE = 'eligible',
	/** The map is marked as inactive in the competitive rotation. */
	INACTIVE = 'inactive',
	/** The map is not in the allowed pool. */
	POOL_RESTRICTION = 'pool_restriction',
	/** The map's gamemode is not in the allowed pool. */
	POOL_GAMEMODE_RESTRICTION = 'pool_gamemode_restriction',
	/** The map has already been picked in the current match. */
	ALREADY_PICKED = 'already_picked',
	/** The map's gamemode has already been used in the current gamemode cycle. */
	USED_GAMEMODE = 'used_gamemode',
	/** The map's gamemode does not match the configured first-gamemode restriction. */
	INVALID_FIRST_GAMEMODE = 'invalid_first_gamemode'
}

export type HeroEligibilityInput = {
	maps: readonly RoomMapState[];
	/** The team whose eligible heroes are requested. */
	slot: MatchSlot;
	catalog: readonly HeroCatalogEntry[];
};

export type HeroEligibilityResult = {
	item: HeroCatalogEntry;
	eligibility: HeroEligibility;
}[];

export enum HeroEligibility {
	ELIGIBLE = 'eligible',
	/** The hero was banned by the current team in a previous round. */
	PREVIOUSLY_BANNED = 'previously_banned',
	/** The hero is already banned in the current map. */
	ALREADY_BANNED = 'already_banned',
	/** The hero has the same role as the first ban on the current map. */
	SECOND_BAN_SAME_ROLE = 'second_ban_same_role'
}

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
export function computeMapEligibility(input: MapEligibilityInput): MapEligibilityResult {
	const { config, maps, catalog } = input;
	const mapIndex = Math.max(maps.length - 1, 0);

	const remaining = [...catalog];
	const result: MapEligibilityResult = [];

	applyEligibilityRule(remaining, result, MapEligibility.INACTIVE, (entry) => !entry.active);

	if (config.allowedMapIds) {
		const allowed = new Set(config.allowedMapIds);
		applyEligibilityRule(
			remaining,
			result,
			MapEligibility.POOL_RESTRICTION,
			(entry) => !allowed.has(entry.id)
		);
	}

	if (config.allowedGamemodeIds) {
		const allowed = new Set(config.allowedGamemodeIds);
		applyEligibilityRule(
			remaining,
			result,
			MapEligibility.POOL_GAMEMODE_RESTRICTION,
			(entry) => !allowed.has(entry.gamemodeId)
		);
	}

	if (mapIndex === 0 && config.firstGamemodeId) {
		applyEligibilityRule(
			remaining,
			result,
			MapEligibility.INVALID_FIRST_GAMEMODE,
			(entry) => entry.gamemodeId !== config.firstGamemodeId
		);
	}

	const pickedMapIds = new Set(
		maps.map((map) => map.mapId).filter((mapId): mapId is string => mapId !== null)
	);

	applyEligibilityRule(remaining, result, MapEligibility.ALREADY_PICKED, (entry) =>
		pickedMapIds.has(entry.id)
	);

	if (config.restrictUsedGamemodes) {
		const allGamemodes = new Set(catalog.map((entry) => entry.gamemodeId));
		const used = usedGamemodesSinceRefresh(maps.slice(0, -1), catalog, allGamemodes);

		// Once every gamemode in the pool has been used, the cycle resets. `used` is empty in
		// that case, so no gamemode is filtered out.
		applyEligibilityRule(remaining, result, MapEligibility.USED_GAMEMODE, (entry) =>
			used.has(entry.gamemodeId)
		);
	}

	// any remaining maps are eligible
	applyEligibilityRule(remaining, result, MapEligibility.ELIGIBLE, () => true);

	return result;
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
export function computeHeroEligibility(input: HeroEligibilityInput): HeroEligibilityResult {
	const { maps, slot, catalog } = input;

	const currentMap = maps[maps.length - 1];
	if (!currentMap) return [];

	const { ownBannedHeroIds, currentBannedHeroIds } = collectBannedHeroIds(maps, currentMap, slot);

	const firstBan = decisionAt(currentMap, DecisionPoint.FIRST_BAN);
	const firstBanHeroId = firstBan && 'heroId' in firstBan.value ? firstBan.value.heroId : null;
	const firstBanHero = firstBanHeroId ? catalog.find((hero) => hero.id === firstBanHeroId) : null;

	const remaining = [...catalog];
	const result: HeroEligibilityResult = [];

	applyEligibilityRule(remaining, result, HeroEligibility.ALREADY_BANNED, (hero) =>
		currentBannedHeroIds.has(hero.id)
	);
	applyEligibilityRule(remaining, result, HeroEligibility.PREVIOUSLY_BANNED, (hero) =>
		ownBannedHeroIds.has(hero.id)
	);
	applyEligibilityRule(
		remaining,
		result,
		HeroEligibility.SECOND_BAN_SAME_ROLE,
		(hero) => hero.role === firstBanHero?.role
	);
	applyEligibilityRule(remaining, result, HeroEligibility.ELIGIBLE, () => true);

	return result;
}

function collectBannedHeroIds(
	maps: readonly RoomMapState[],
	currentMap: RoomMapState,
	slot: MatchSlot
) {
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

	return { ownBannedHeroIds, currentBannedHeroIds };
}

function applyEligibilityRule<T, E>(
	remaining: T[],
	result: { item: T; eligibility: E }[],
	eligibility: E,
	rule: (item: T) => boolean
) {
	let i = 0;
	while (i < remaining.length) {
		const item = remaining[i];
		const matches = rule(item);
		if (matches) {
			result.push({ item, eligibility });
			remaining.splice(i, 1);
		} else {
			i++;
		}
	}
}
