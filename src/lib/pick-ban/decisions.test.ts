import { describe, expect, it } from 'vitest';
import { MatchSlot } from '$lib/types';
import {
	applyDecision,
	applyTimeoutFallback,
	bannerSlots,
	DecisionError,
	decisionDeadline,
	fallbackDecision,
	isDeadlinePassed,
	mapDecisionsComplete,
	nextDecisionPoint
} from './decisions';
import { DecisionPoint, PickBanMapType, RoomState, type RoomMapState } from './types';
import {
	banOrder,
	catalog,
	config,
	decision,
	heroBan,
	HERO,
	MAP,
	mapPick,
	roomMap
} from './test-helpers';

function openSlot(cfg = config(), map: RoomMapState = roomMap()): MatchSlot {
	return nextDecisionPoint(cfg, [map])!.slot;
}

describe('nextDecisionPoint', () => {
	it('opens the map pick for the first-ban team', () => {
		expect(nextDecisionPoint(config(), [roomMap()])).toEqual({
			point: DecisionPoint.MAP_PICK,
			slot: MatchSlot.A
		});
	});

	it('then opens the ban order for the same team', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [mapPick(MatchSlot.A, MAP.antarctic)]
		});
		expect(nextDecisionPoint(config(), [map])).toEqual({
			point: DecisionPoint.BAN_ORDER,
			slot: MatchSlot.A
		});
	});

	it('opens the first ban after a non-conceded ban order', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [mapPick(MatchSlot.A, MAP.antarctic), banOrder(MatchSlot.A, false)]
		});
		expect(nextDecisionPoint(config(), [map])).toEqual({
			point: DecisionPoint.FIRST_BAN,
			slot: MatchSlot.A
		});
	});

	it('swaps the ban order after a conceded first ban', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [mapPick(MatchSlot.A, MAP.antarctic), banOrder(MatchSlot.A, true)]
		});
		expect(nextDecisionPoint(config(), [map])).toEqual({
			point: DecisionPoint.FIRST_BAN,
			slot: MatchSlot.B
		});
	});

	it('skips the ban order when conceding is not allowed', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [mapPick(MatchSlot.A, MAP.antarctic)]
		});
		expect(nextDecisionPoint(config({ allowConcedeFirstBan: false }), [map])).toEqual({
			point: DecisionPoint.FIRST_BAN,
			slot: MatchSlot.A
		});
	});

	it('returns null outside the in-progress state', () => {
		expect(nextDecisionPoint(config(), [roomMap()], RoomState.OPEN)).toBeNull();
		expect(nextDecisionPoint(config(), [roomMap()], RoomState.READY_CHECK)).toBeNull();
		expect(nextDecisionPoint(config(), [roomMap()], RoomState.FINISHED)).toBeNull();
	});

	it('skips the map pick for a fixed map pool', () => {
		const cfg = config({
			mapType: PickBanMapType.FIXED,
			fixedMapIds: [MAP.antarctic, MAP.dorado, MAP.midtown]
		});
		const map = roomMap({ mapId: MAP.antarctic });

		expect(nextDecisionPoint(cfg, [map])).toEqual({
			point: DecisionPoint.BAN_ORDER,
			slot: MatchSlot.A
		});
	});
});

describe('applyDecision', () => {
	it('records the full decision order for a map', () => {
		const cfg = config();
		let map = roomMap();

		const pick = applyDecision({
			config: cfg,
			maps: [map],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.antarctic },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1_000
		});
		expect(pick.ok).toBe(true);
		if (!pick.ok) return;
		map = pick.map;
		expect(map.mapId).toBe(MAP.antarctic);

		const order = applyDecision({
			config: cfg,
			maps: [map],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.BAN_ORDER, concede: false },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 2_000
		});
		expect(order.ok).toBe(true);
		if (!order.ok) return;
		map = order.map;

		const first = applyDecision({
			config: cfg,
			maps: [map],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.FIRST_BAN, heroId: HERO.rein },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 3_000
		});
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		map = first.map;

		const second = applyDecision({
			config: cfg,
			maps: [map],
			catalog,
			slot: MatchSlot.B,
			decision: { point: DecisionPoint.SECOND_BAN, heroId: HERO.tracer },
			actor: { type: 'captain', userId: 'captain-b' },
			now: 4_000
		});
		expect(second.ok).toBe(true);
		if (!second.ok) return;
		map = second.map;

		expect(map.decisions.map((entry) => entry.point)).toEqual([
			DecisionPoint.MAP_PICK,
			DecisionPoint.BAN_ORDER,
			DecisionPoint.FIRST_BAN,
			DecisionPoint.SECOND_BAN
		]);
		expect(map.decisionsCompletedAt).toBe(4_000);
		expect(mapDecisionsComplete(cfg, map)).toBe(true);
		expect(nextDecisionPoint(cfg, [map])).toBeNull();
	});

	it('rejects an action from the wrong team', () => {
		const result = applyDecision({
			config: config(),
			maps: [roomMap()],
			catalog,
			slot: MatchSlot.B,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.antarctic },
			actor: { type: 'captain', userId: 'captain-b' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.WRONG_TEAM });
	});

	it('rejects an ineligible map', () => {
		const result = applyDecision({
			config: config({ allowedMapIds: [MAP.antarctic] }),
			maps: [roomMap()],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.dorado },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.INVALID_MAP });
	});

	it('rejects a map that was already picked earlier in the match', () => {
		const previous = roomMap({ index: 0, mapId: MAP.antarctic });
		const current = roomMap({ index: 1 });

		const result = applyDecision({
			config: config(),
			maps: [previous, current],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.antarctic },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.INVALID_MAP });
	});

	it('rejects a second ban from the same role as the first', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [
				mapPick(MatchSlot.A, MAP.antarctic),
				banOrder(MatchSlot.A, false),
				heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)
			]
		});

		const result = applyDecision({
			config: config(),
			maps: [map],
			catalog,
			slot: MatchSlot.B,
			decision: { point: DecisionPoint.SECOND_BAN, heroId: HERO.winston },
			actor: { type: 'captain', userId: 'captain-b' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.INVALID_HERO });
	});

	it('rejects a hero the team banned on an earlier map', () => {
		const previous = roomMap({
			index: 0,
			decisions: [heroBan(DecisionPoint.SECOND_BAN, MatchSlot.B, HERO.tracer)]
		});
		const current = roomMap({
			index: 1,
			mapId: MAP.dorado,
			decisions: [
				mapPick(MatchSlot.A, MAP.dorado),
				banOrder(MatchSlot.A, false),
				heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein)
			]
		});

		const result = applyDecision({
			config: config(),
			maps: [previous, current],
			catalog,
			slot: MatchSlot.B,
			decision: { point: DecisionPoint.SECOND_BAN, heroId: HERO.tracer },
			actor: { type: 'captain', userId: 'captain-b' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.INVALID_HERO });
	});

	it('records a conceded first ban and swaps the banner order', () => {
		const cfg = config();
		const picked = roomMap({
			mapId: MAP.antarctic,
			decisions: [mapPick(MatchSlot.A, MAP.antarctic)]
		});

		const order = applyDecision({
			config: cfg,
			maps: [picked],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.BAN_ORDER, concede: true },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 2
		});
		expect(order.ok).toBe(true);
		if (!order.ok) return;

		expect(bannerSlots(cfg, order.map)).toEqual({
			first: MatchSlot.B,
			second: MatchSlot.A
		});
		expect(nextDecisionPoint(cfg, [order.map])).toEqual({
			point: DecisionPoint.FIRST_BAN,
			slot: MatchSlot.B
		});
	});

	it('rejects a concede when the configuration does not allow it', () => {
		const cfg = config({ allowConcedeFirstBan: false });
		const result = applyDecision({
			config: cfg,
			maps: [
				roomMap({
					mapId: MAP.antarctic,
					decisions: [mapPick(MatchSlot.A, MAP.antarctic)]
				})
			],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.BAN_ORDER, concede: true },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.WRONG_DECISION_POINT });
	});

	it('rejects duplicate submissions for the same decision point', () => {
		const cfg = config();
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [decision(DecisionPoint.MAP_PICK, MatchSlot.A, { mapId: MAP.antarctic })]
		});

		const result = applyDecision({
			config: cfg,
			maps: [map],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.busan },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.ALREADY_RECORDED });
	});

	it('rejects a map pick when the pool is fixed', () => {
		const cfg = config({
			mapType: PickBanMapType.FIXED,
			fixedMapIds: [MAP.antarctic, MAP.dorado, MAP.midtown]
		});
		const result = applyDecision({
			config: cfg,
			maps: [roomMap({ mapId: MAP.antarctic })],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.busan },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1
		});

		expect(result).toEqual({ ok: false, error: DecisionError.WRONG_DECISION_POINT });
	});

	it('rejects decisions outside the in-progress state', () => {
		const result = applyDecision({
			config: config(),
			maps: [roomMap()],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.antarctic },
			actor: { type: 'captain', userId: 'captain-a' },
			now: 1,
			status: RoomState.READY_CHECK
		});

		expect(result).toEqual({ ok: false, error: DecisionError.WRONG_STATE });
	});

	it('records an admin override with the acting admin', () => {
		const result = applyDecision({
			config: config(),
			maps: [roomMap()],
			catalog,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.antarctic },
			actor: { type: 'admin', userId: 'admin-1' },
			now: 1
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.decision.actorUserId).toBe('admin-1');
		expect(result.decision.automatic).toBe(false);
	});
});

describe('fallbackDecision', () => {
	it('never concedes the first ban', () => {
		const result = fallbackDecision({
			config: config(),
			maps: [
				roomMap({
					mapId: MAP.antarctic,
					decisions: [mapPick(MatchSlot.A, MAP.antarctic)]
				})
			],
			catalog
		});

		expect(result).toEqual({
			ok: true,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.BAN_ORDER, concede: false }
		});
	});

	it('picks the first eligible map with random zero', () => {
		const result = fallbackDecision({
			config: config(),
			maps: [roomMap()],
			catalog,
			random: () => 0
		});

		expect(result).toEqual({
			ok: true,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.antarctic }
		});
	});

	it('picks a uniform map based on the injected random source', () => {
		const result = fallbackDecision({
			config: config(),
			maps: [roomMap()],
			catalog,
			random: () => 0.99
		});

		expect(result).toEqual({
			ok: true,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.MAP_PICK, mapId: MAP.midtown }
		});
	});

	it('picks an eligible hero for a first ban', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [mapPick(MatchSlot.A, MAP.antarctic), banOrder(MatchSlot.A, false)]
		});
		const result = fallbackDecision({
			config: config(),
			maps: [map],
			catalog,
			random: () => 0
		});

		expect(result).toEqual({
			ok: true,
			slot: MatchSlot.A,
			decision: { point: DecisionPoint.FIRST_BAN, heroId: HERO.rein }
		});
	});

	it('returns no eligible maps when every allowed map has been picked', () => {
		const previous = roomMap({ index: 0, mapId: MAP.antarctic });
		const current = roomMap({ index: 1 });

		const result = fallbackDecision({
			config: config({ allowedMapIds: [MAP.antarctic] }),
			maps: [previous, current],
			catalog
		});

		expect(result).toEqual({ ok: false, error: DecisionError.NO_ELIGIBLE_MAP });
	});

	it('returns no eligible heroes when the role restriction exhausts the pool', () => {
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
			mapId: MAP.antarctic,
			decisions: [
				mapPick(MatchSlot.A, MAP.antarctic),
				banOrder(MatchSlot.A, false),
				heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.tracer)
			]
		});

		const result = fallbackDecision({
			config: config(),
			maps: [...previous, current],
			catalog
		});

		expect(result).toEqual({ ok: false, error: DecisionError.NO_ELIGIBLE_HERO });
	});

	it('returns no open decision when the map is complete', () => {
		const map = roomMap({
			mapId: MAP.antarctic,
			decisions: [
				mapPick(MatchSlot.A, MAP.antarctic),
				banOrder(MatchSlot.A, false),
				heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein),
				heroBan(DecisionPoint.SECOND_BAN, MatchSlot.B, HERO.tracer)
			]
		});

		expect(fallbackDecision({ config: config(), maps: [map], catalog })).toEqual({
			ok: false,
			error: DecisionError.NO_OPEN_DECISION
		});
	});
});

describe('applyTimeoutFallback', () => {
	it('records an automatic decision with no actor', () => {
		const result = applyTimeoutFallback({
			config: config(),
			maps: [roomMap()],
			catalog,
			random: () => 0,
			now: 5_000
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.map.mapId).toBe(MAP.antarctic);
		expect(result.decision.automatic).toBe(true);
		expect(result.decision.actorUserId).toBeNull();
		expect(result.decision.createdAt).toBe(5_000);
	});
});

describe('deadlines', () => {
	it('derives the deadline from the configured timeout', () => {
		expect(decisionDeadline(1_000, config())).toBe(61_000);
		expect(decisionDeadline(1_000, config({ decisionTimeoutSeconds: 30 }))).toBe(31_000);
	});

	it('considers the deadline passed exactly at expiry', () => {
		expect(isDeadlinePassed(61_000, 60_999)).toBe(false);
		expect(isDeadlinePassed(61_000, 61_000)).toBe(true);
		expect(isDeadlinePassed(61_000, 61_001)).toBe(true);
	});
});

describe('openSlot helper', () => {
	it('returns the acting slot for the current point', () => {
		expect(openSlot()).toBe(MatchSlot.A);
	});
});
