import { describe, expect, it } from 'vitest';
import { MatchSlot, Role } from '$lib/types';
import {
	computeHeroEligibility,
	computeMapEligibility,
	fixedMapForGame,
	MapEligibility,
	usedGamemodesSinceRefresh,
	type MapEligibilityResult,
	type HeroEligibilityResult,
	HeroEligibility
} from './eligibility';
import {
	DecisionPoint,
	MapOutcome,
	PickBanMapType,
	RoomMapReportState,
	type MapCatalogEntry,
	type RoomMapState
} from './types';
import {
	config,
	GAMEMODE,
	hero,
	heroBan,
	HERO,
	heroes,
	MAP,
	map,
	maps,
	roomMap
} from './test-helpers';

function picked(mapId: string, index: number): RoomMapState {
	return roomMap({
		index,
		mapId,
		decisions: [],
		reportState: RoomMapReportState.AGREED,
		outcome: MapOutcome.TEAM_A,
		resultRecordedAt: new Date(1_000),
		resolvedById: null
	});
}

function mapEligibility(result: MapEligibilityResult, mapId: string): MapEligibility | null {
	return result.find((entry) => entry.item.id === mapId)?.eligibility ?? null;
}

function heroEligibility(result: HeroEligibilityResult, heroId: string): HeroEligibility | null {
	return result.find((entry) => entry.item.id === heroId)?.eligibility ?? null;
}

describe('computeMapEligibility', () => {
	it('returns every active map by default', () => {
		const result = computeMapEligibility({
			config: config(),
			maps: [roomMap()],
			catalog: maps
		});

		expect(result.map((entry) => entry.item.id)).toEqual(maps.map((entry) => entry.id));
	});

	it('filters out inactive maps', () => {
		const catalog = [...maps, map('map-old', 'old-map', GAMEMODE.control, false)];
		const result = computeMapEligibility({ config: config(), maps: [roomMap()], catalog });

		expect(mapEligibility(result, 'map-old')).toEqual(MapEligibility.INACTIVE);
	});

	it('applies the allowed map subset', () => {
		const result = computeMapEligibility({
			config: config({ allowedMapIds: [MAP.antarctic, MAP.dorado] }),
			maps: [roomMap()],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.antarctic)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.dorado)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.busan)).toEqual(MapEligibility.POOL_RESTRICTION);
	});

	it('applies the allowed gamemode subset', () => {
		const result = computeMapEligibility({
			config: config({ allowedGamemodeIds: [GAMEMODE.hybrid] }),
			maps: [roomMap()],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.kingsRow)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.midtown)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.antarctic)).toEqual(MapEligibility.POOL_GAMEMODE_RESTRICTION);
	});

	it('intersects the allowed gamemode subset with the first gamemode', () => {
		const result = computeMapEligibility({
			config: config({
				allowedGamemodeIds: [GAMEMODE.control, GAMEMODE.escort],
				firstGamemodeId: GAMEMODE.escort
			}),
			maps: [roomMap()],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.dorado)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.antarctic)).toEqual(MapEligibility.INVALID_FIRST_GAMEMODE);
		expect(mapEligibility(result, MAP.kingsRow)).toEqual(MapEligibility.POOL_GAMEMODE_RESTRICTION);
	});

	it('restricts the first map to the fixed first gamemode', () => {
		const result = computeMapEligibility({
			config: config({ firstGamemodeId: GAMEMODE.control }),
			maps: [roomMap()],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.antarctic)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.dorado)).toEqual(MapEligibility.INVALID_FIRST_GAMEMODE);
	});

	it('does not restrict later maps to the first gamemode', () => {
		const result = computeMapEligibility({
			config: config({ firstGamemodeId: GAMEMODE.control }),
			maps: [picked(MAP.antarctic, 0), roomMap({ index: 1 })],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.busan)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.dorado)).toEqual(MapEligibility.ELIGIBLE);
	});

	it('never allows a map that was already picked', () => {
		const result = computeMapEligibility({
			config: config(),
			maps: [picked(MAP.antarctic, 0), picked(MAP.dorado, 1), roomMap({ index: 2 })],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.antarctic)).toEqual(MapEligibility.ALREADY_PICKED);
		expect(mapEligibility(result, MAP.dorado)).toEqual(MapEligibility.ALREADY_PICKED);
		expect(mapEligibility(result, MAP.busan)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.rialto)).toEqual(MapEligibility.ELIGIBLE);
	});

	it('keeps maps from already used gamemodes unavailable', () => {
		const result = computeMapEligibility({
			config: config({ restrictUsedGamemodes: true }),
			maps: [picked(MAP.antarctic, 0), roomMap({ index: 1 })],
			catalog: maps
		});

		expect(mapEligibility(result, MAP.busan)).toEqual(MapEligibility.USED_GAMEMODE);
		expect(mapEligibility(result, MAP.rialto)).toEqual(MapEligibility.ELIGIBLE);
	});

	it('refreshes all gamemodes once every gamemode has been used', () => {
		const result = computeMapEligibility({
			config: config({ restrictUsedGamemodes: true }),
			maps: [
				picked(MAP.antarctic, 0),
				picked(MAP.dorado, 1),
				picked(MAP.kingsRow, 2),
				roomMap({ index: 3 })
			],
			catalog: maps
		});

		// The cycle refreshed, so unused maps from every gamemode are available again.
		expect(mapEligibility(result, MAP.busan)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.rialto)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.midtown)).toEqual(MapEligibility.ELIGIBLE);
	});

	it('tracks multiple refresh cycles', () => {
		const result = computeMapEligibility({
			config: config({ restrictUsedGamemodes: true }),
			maps: [
				picked(MAP.antarctic, 0),
				picked(MAP.dorado, 1),
				picked(MAP.kingsRow, 2),
				picked(MAP.busan, 3),
				picked(MAP.rialto, 4),
				roomMap({ index: 5 })
			],
			catalog: maps
		});

		// Control and escort are used in the new cycle; hybrid is not.
		expect(mapEligibility(result, MAP.midtown)).toEqual(MapEligibility.ELIGIBLE);
		expect(mapEligibility(result, MAP.antarctic)).toEqual(MapEligibility.ALREADY_PICKED);
	});
});

describe('usedGamemodesSinceRefresh', () => {
	it('returns an empty set for an empty history', () => {
		expect(usedGamemodesSinceRefresh([], maps, new Set([GAMEMODE.control]))).toEqual(new Set());
	});

	it('resets whenever the whole pool has been seen', () => {
		const pool = new Set([GAMEMODE.control, GAMEMODE.escort]);
		const history = [picked(MAP.antarctic, 0), picked(MAP.dorado, 1), picked(MAP.busan, 2)];

		expect(usedGamemodesSinceRefresh(history, maps, pool)).toEqual(new Set([GAMEMODE.control]));
	});

	it('ignores gamemodes outside the pool', () => {
		const pool = new Set([GAMEMODE.control]);
		const history = [picked(MAP.dorado, 0)];

		expect(usedGamemodesSinceRefresh(history, maps, pool)).toEqual(new Set());
	});
});

describe('fixedMapForGame', () => {
	it('returns the configured map for the game index', () => {
		const cfg = config({
			mapType: PickBanMapType.FIXED,
			fixedMapIds: [MAP.antarctic, MAP.dorado, MAP.midtown]
		});

		expect(fixedMapForGame(cfg, 0, maps).id).toBe(MAP.antarctic);
		expect(fixedMapForGame(cfg, 1, maps).id).toBe(MAP.dorado);
	});

	it('throws when the pool is not fixed', () => {
		expect(() => fixedMapForGame(config(), 0, maps)).toThrow();
	});

	it('cycles maps when fixed map list is exhausted', () => {
		const cfg = config({ mapType: PickBanMapType.FIXED, fixedMapIds: [MAP.antarctic, MAP.busan] });
		expect(fixedMapForGame(cfg, 2, maps).id).toBe(MAP.antarctic);
	});

	it('throws when the configured map is missing or inactive', () => {
		const catalogue = [...maps, map('map-inactive', 'inactive', GAMEMODE.control, false)];
		const cfg = config({
			mapType: PickBanMapType.FIXED,
			fixedMapIds: [MAP.antarctic, MAP.dorado, MAP.midtown]
		});

		expect(() =>
			fixedMapForGame(
				cfg,
				0,
				catalogue.filter((entry) => entry.id !== MAP.antarctic)
			)
		).toThrow();

		const inactiveConfig = config({
			mapType: PickBanMapType.FIXED,
			fixedMapIds: ['map-inactive', MAP.dorado, MAP.midtown]
		});
		expect(() => fixedMapForGame(inactiveConfig, 0, catalogue)).toThrow();
	});
});

describe('computeHeroEligibility', () => {
	it('allows every hero for the first ban', () => {
		const result = computeHeroEligibility({
			maps: [roomMap()],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(result.every((entry) => entry.eligibility === HeroEligibility.ELIGIBLE)).toBe(true);
	});

	it('requires the second ban to use a different role from the first', () => {
		const current = roomMap({
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)]
		});

		const result = computeHeroEligibility({
			maps: [current],
			slot: MatchSlot.B,
			catalog: heroes
		});

		expect(heroEligibility(result, HERO.winston)).toEqual(HeroEligibility.SECOND_BAN_SAME_ROLE);
		expect(heroEligibility(result, HERO.rein)).toEqual(HeroEligibility.ALREADY_BANNED);
	});

	it('excludes heroes the team banned on earlier maps', () => {
		const previous = roomMap({
			index: 0,
			decisions: [heroBan(DecisionPoint.SECOND_BAN, MatchSlot.A, HERO.tracer)]
		});
		const current = roomMap({
			index: 1,
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.B, HERO.rein)]
		});

		const result = computeHeroEligibility({
			maps: [previous, current],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(heroEligibility(result, HERO.tracer)).toEqual(HeroEligibility.PREVIOUSLY_BANNED);
		expect(heroEligibility(result, HERO.rein)).toEqual(HeroEligibility.ALREADY_BANNED);
		expect(heroEligibility(result, HERO.genji)).toEqual(HeroEligibility.ELIGIBLE);
	});

	it('allows a hero the opposing team banned on an earlier map', () => {
		const previous = roomMap({
			index: 0,
			decisions: [heroBan(DecisionPoint.SECOND_BAN, MatchSlot.A, HERO.tracer)]
		});
		const current = roomMap({
			index: 1,
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)]
		});

		const result = computeHeroEligibility({
			maps: [previous, current],
			slot: MatchSlot.B,
			catalog: heroes
		});

		expect(heroEligibility(result, HERO.tracer)).toEqual(HeroEligibility.ELIGIBLE);
	});

	it('keeps the first ban unrestricted by earlier bans on other roles', () => {
		const previous = roomMap({
			index: 0,
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)]
		});
		const current = roomMap({ index: 1 });

		const result = computeHeroEligibility({
			maps: [previous, current],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(heroEligibility(result, HERO.rein)).toEqual(HeroEligibility.PREVIOUSLY_BANNED);
		expect(heroEligibility(result, HERO.winston)).toEqual(HeroEligibility.ELIGIBLE);
	});

	it('includes every hero when there is no current map', () => {
		const result = computeHeroEligibility({
			maps: [],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(result.every((entry) => entry.eligibility === HeroEligibility.ELIGIBLE)).toBe(true);
	});

	it('works with a catalogue containing one hero per role', () => {
		const singleRole = [
			hero('tank', 'tank', Role.TANK),
			hero('damage', 'damage', Role.DAMAGE),
			hero('support', 'support', Role.SUPPORT)
		];
		const current = roomMap({
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, 'tank')]
		});

		const result = computeHeroEligibility({
			maps: [current],
			slot: MatchSlot.B,
			catalog: singleRole
		});
		expect(heroEligibility(result, 'tank')).toEqual(HeroEligibility.ALREADY_BANNED);
		expect(heroEligibility(result, 'damage')).toEqual(HeroEligibility.ELIGIBLE);
		expect(heroEligibility(result, 'support')).toEqual(HeroEligibility.ELIGIBLE);
	});
});

describe('inactive gamemode maps', () => {
	it('do not contribute maps even when their gamemode is used', () => {
		const catalog: MapCatalogEntry[] = [
			...maps,
			map('map-retired', 'retired', GAMEMODE.control, false)
		];
		const current = roomMap({ index: 1 });

		const eligible = computeMapEligibility({
			config: config({ restrictUsedGamemodes: true }),
			maps: [picked(MAP.antarctic, 0), current],
			catalog
		});

		expect(mapEligibility(eligible, 'map-retired')).toEqual(MapEligibility.INACTIVE);
	});
});
