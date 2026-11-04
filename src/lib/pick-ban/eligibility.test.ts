import { describe, expect, it } from 'vitest';
import { MatchSlot, Role } from '$lib/types';
import {
	eligibleHeroes,
	eligibleMaps,
	fixedMapForGame,
	usedGamemodesSinceRefresh
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
		result: {
			outcome: MapOutcome.TEAM_A,
			recordedAt: 1,
			resolvedById: null
		}
	});
}

describe('eligibleMaps', () => {
	it('returns every active map by default', () => {
		const result = eligibleMaps({
			config: config(),
			maps: [roomMap()],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual(maps.map((entry) => entry.id));
	});

	it('filters out inactive maps', () => {
		const catalogue = [...maps, map('map-old', 'old-map', GAMEMODE.control, false)];
		const result = eligibleMaps({ config: config(), maps: [roomMap()], catalog: catalogue });

		expect(result.some((entry) => entry.id === 'map-old')).toBe(false);
	});

	it('applies the allowed map subset', () => {
		const result = eligibleMaps({
			config: config({ allowedMapIds: [MAP.antarctic, MAP.dorado] }),
			maps: [roomMap()],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([MAP.antarctic, MAP.dorado]);
	});

	it('applies the allowed gamemode subset', () => {
		const result = eligibleMaps({
			config: config({ allowedGamemodeIds: [GAMEMODE.hybrid] }),
			maps: [roomMap()],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([MAP.kingsRow, MAP.midtown]);
	});

	it('intersects the allowed gamemode subset with the first gamemode', () => {
		const result = eligibleMaps({
			config: config({
				allowedGamemodeIds: [GAMEMODE.control, GAMEMODE.escort],
				firstGamemodeId: GAMEMODE.escort
			}),
			maps: [roomMap()],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([MAP.dorado, MAP.rialto]);
	});

	it('restricts the first map to the fixed first gamemode', () => {
		const result = eligibleMaps({
			config: config({ firstGamemodeId: GAMEMODE.control }),
			maps: [roomMap()],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([MAP.antarctic, MAP.busan]);
	});

	it('does not restrict later maps to the first gamemode', () => {
		const result = eligibleMaps({
			config: config({ firstGamemodeId: GAMEMODE.control }),
			maps: [picked(MAP.antarctic, 0), roomMap({ index: 1 })],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([
			MAP.busan,
			MAP.dorado,
			MAP.rialto,
			MAP.kingsRow,
			MAP.midtown
		]);
	});

	it('never allows a map that was already picked', () => {
		const result = eligibleMaps({
			config: config(),
			maps: [picked(MAP.antarctic, 0), picked(MAP.dorado, 1), roomMap({ index: 2 })],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([
			MAP.busan,
			MAP.rialto,
			MAP.kingsRow,
			MAP.midtown
		]);
	});

	it('keeps maps from already used gamemodes unavailable', () => {
		const result = eligibleMaps({
			config: config({ restrictUsedGamemodes: true }),
			maps: [picked(MAP.antarctic, 0), roomMap({ index: 1 })],
			catalog: maps
		});

		expect(result.map((entry) => entry.id)).toEqual([
			MAP.dorado,
			MAP.rialto,
			MAP.kingsRow,
			MAP.midtown
		]);
	});

	it('refreshes all gamemodes once every gamemode has been used', () => {
		const result = eligibleMaps({
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
		expect(result.map((entry) => entry.id)).toEqual([MAP.busan, MAP.rialto, MAP.midtown]);
	});

	it('tracks multiple refresh cycles', () => {
		const result = eligibleMaps({
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
		expect(result.map((entry) => entry.id)).toEqual([MAP.midtown]);
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

describe('eligibleHeroes', () => {
	it('allows every hero for the first ban', () => {
		const result = eligibleHeroes({
			maps: [roomMap()],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(result.map((entry) => entry.id)).toEqual(heroes.map((entry) => entry.id));
	});

	it('requires the second ban to use a different role from the first', () => {
		const current = roomMap({
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)]
		});

		const result = eligibleHeroes({
			maps: [current],
			slot: MatchSlot.B,
			catalog: heroes
		});

		expect(result.map((entry) => entry.id)).toEqual([
			HERO.tracer,
			HERO.genji,
			HERO.ana,
			HERO.kiriko
		]);
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

		const result = eligibleHeroes({
			maps: [previous, current],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(result.some((entry) => entry.id === HERO.tracer)).toBe(false);
		expect(result.some((entry) => entry.id === HERO.genji)).toBe(true);
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

		const result = eligibleHeroes({
			maps: [previous, current],
			slot: MatchSlot.B,
			catalog: heroes
		});

		expect(result.some((entry) => entry.id === HERO.tracer)).toBe(true);
	});

	it('keeps the first ban unrestricted by earlier bans on other roles', () => {
		const previous = roomMap({
			index: 0,
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)]
		});
		const current = roomMap({ index: 1 });

		const result = eligibleHeroes({
			maps: [previous, current],
			slot: MatchSlot.A,
			catalog: heroes
		});

		expect(result.some((entry) => entry.id === HERO.rein)).toBe(false);
		expect(result.some((entry) => entry.id === HERO.winston)).toBe(true);
	});

	it('returns no heroes when every eligible role is exhausted', () => {
		const previous = [
			roomMap({
				index: 0,
				decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.B, HERO.rein)]
			}),
			roomMap({
				index: 1,
				decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.B, HERO.winston)]
			}),
			roomMap({
				index: 2,
				decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.B, HERO.ana)]
			}),
			roomMap({
				index: 3,
				decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.B, HERO.kiriko)]
			})
		];
		const current = roomMap({
			index: 4,
			decisions: [heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.tracer)]
		});

		const result = eligibleHeroes({
			maps: [...previous, current],
			slot: MatchSlot.B,
			catalog: heroes
		});

		expect(result).toEqual([]);
	});

	it('returns the catalogue when there is no current map', () => {
		expect(eligibleHeroes({ maps: [], slot: MatchSlot.A, catalog: heroes })).toEqual(heroes);
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

		const result = eligibleHeroes({ maps: [current], slot: MatchSlot.B, catalog: singleRole });
		expect(result.map((entry) => entry.id)).toEqual(['damage', 'support']);
	});
});

describe('inactive gamemode maps', () => {
	it('do not contribute maps even when their gamemode is used', () => {
		const catalogue: MapCatalogEntry[] = [
			...maps,
			map('map-retired', 'retired', GAMEMODE.control, false)
		];
		const current = roomMap({ index: 1 });

		const eligible = eligibleMaps({
			config: config({ restrictUsedGamemodes: true }),
			maps: [picked(MAP.antarctic, 0), current],
			catalog: catalogue
		});

		expect(eligible.some((entry) => entry.id === 'map-retired')).toBe(false);
	});
});
