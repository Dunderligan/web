import { flipSlot } from '$lib/match';
import { MatchSlot } from '$lib/types';
import type { ResolvedPickBanConfig } from './config';
import { eligibleHeroes, eligibleMaps } from './eligibility';
import {
	DecisionPoint,
	RoomState,
	type DecisionValue,
	type HeroCatalogEntry,
	type MapCatalogEntry,
	type RecordedDecision,
	type RoomMapState,
	PickBanMapType
} from './types';
import { concededFirstBan, decisionAt } from './util';

/** A decision that a team is expected to make next. */
export type OpenDecisionPoint = {
	point: DecisionPoint;
	slot: MatchSlot;
};

/** A decision supplied by a captain, admin or the server. */
export type DecisionInput =
	| { point: DecisionPoint.MAP_PICK; mapId: string }
	| { point: DecisionPoint.BAN_ORDER; concede: boolean }
	| { point: DecisionPoint.FIRST_BAN; heroId: string }
	| { point: DecisionPoint.SECOND_BAN; heroId: string };

export type DecisionActor =
	| { type: 'captain'; userId: string }
	| { type: 'admin'; userId: string }
	| { type: 'automatic' };

export type DecisionCatalog = {
	maps: readonly MapCatalogEntry[];
	heroes: readonly HeroCatalogEntry[];
};

export enum DecisionError {
	WRONG_STATE = 'wrong_state',
	ALREADY_RECORDED = 'already_recorded',
	NO_OPEN_DECISION = 'no_open_decision',
	WRONG_DECISION_POINT = 'wrong_decision_point',
	WRONG_TEAM = 'wrong_team',
	INVALID_MAP = 'invalid_map',
	INVALID_HERO = 'invalid_hero',
	CONCEDE_NOT_ALLOWED = 'concede_not_allowed',
	NO_ELIGIBLE_MAP = 'no_eligible_map',
	NO_ELIGIBLE_HERO = 'no_eligible_hero'
}

export type ApplyDecisionInput = {
	config: ResolvedPickBanConfig;
	/** All maps in the room, with the current map last. */
	maps: readonly RoomMapState[];
	catalog: DecisionCatalog;
	/** The slot supplied by the server for the acting user. Never supplied by the client. */
	slot: MatchSlot;
	decision: DecisionInput;
	actor: DecisionActor;
	/** Epoch milliseconds. */
	now: number;
	status?: RoomState;
};

export type ApplyDecisionResult =
	| { ok: true; map: RoomMapState; decision: RecordedDecision }
	| { ok: false; error: DecisionError };

export type FallbackInput = {
	config: ResolvedPickBanConfig;
	maps: readonly RoomMapState[];
	catalog: DecisionCatalog;
	/** Injectable randomness for deterministic tests. Must return a number in [0, 1). */
	random?: () => number;
	status?: RoomState;
};

export type FallbackResult =
	| { ok: true; decision: DecisionInput; slot: MatchSlot }
	| { ok: false; error: DecisionError };

/**
 * Returns the single open decision point for the current map, or null when the map's
 * decisions are complete or the room is not in progress.
 */
export function nextDecisionPoint(
	config: ResolvedPickBanConfig,
	maps: readonly RoomMapState[],
	status: RoomState = RoomState.IN_PROGRESS
): OpenDecisionPoint | null {
	if (status !== RoomState.IN_PROGRESS) return null;

	const currentMap = maps[maps.length - 1];
	if (!currentMap) return null;

	if (config.mapType !== PickBanMapType.FIXED && !decisionAt(currentMap, DecisionPoint.MAP_PICK)) {
		return { point: DecisionPoint.MAP_PICK, slot: currentMap.firstBanSlot };
	}

	const banners = bannerSlots(config, currentMap);

	if (
		config.allowConcedeFirstBan &&
		!decisionAt(currentMap, DecisionPoint.BAN_ORDER) &&
		!decisionAt(currentMap, DecisionPoint.FIRST_BAN)
	) {
		return { point: DecisionPoint.BAN_ORDER, slot: currentMap.firstBanSlot };
	}

	if (!decisionAt(currentMap, DecisionPoint.FIRST_BAN)) {
		return { point: DecisionPoint.FIRST_BAN, slot: banners.first };
	}

	if (!decisionAt(currentMap, DecisionPoint.SECOND_BAN)) {
		return { point: DecisionPoint.SECOND_BAN, slot: banners.second };
	}

	return null;
}

/** Returns the first and second banner on a map, taking a conceded first ban into account. */
export function bannerSlots(
	config: ResolvedPickBanConfig,
	map: RoomMapState
): { first: MatchSlot; second: MatchSlot } {
	const conceded = config.allowConcedeFirstBan && concededFirstBan(map);
	const first = conceded ? flipSlot(map.firstBanSlot) : map.firstBanSlot;
	return { first, second: flipSlot(first) };
}

/** Whether every decision for a map has been recorded. */
export function mapDecisionsComplete(config: ResolvedPickBanConfig, map: RoomMapState): boolean {
	if (map.mapId === null) return false;
	if (config.mapType !== PickBanMapType.FIXED && !decisionAt(map, DecisionPoint.MAP_PICK))
		return false;
	if (config.allowConcedeFirstBan && !decisionAt(map, DecisionPoint.BAN_ORDER)) return false;
	if (!decisionAt(map, DecisionPoint.FIRST_BAN)) return false;
	if (!decisionAt(map, DecisionPoint.SECOND_BAN)) return false;
	return true;
}

/**
 * Applies a decision to the current map, returning a new map state. The input is not mutated.
 * The decision is validated against the open decision point, the acting team and the
 * eligibility rules before it is recorded. Exactly one decision is recorded per point.
 */
export function applyDecision(input: ApplyDecisionInput): ApplyDecisionResult {
	const { config, maps, slot, decision, actor, now } = input;
	const status = input.status ?? RoomState.IN_PROGRESS;

	if (status !== RoomState.IN_PROGRESS) {
		return { ok: false, error: DecisionError.WRONG_STATE };
	}

	const currentMap = maps[maps.length - 1];
	if (!currentMap) return { ok: false, error: DecisionError.NO_OPEN_DECISION };

	if (decisionAt(currentMap, decision.point)) {
		return { ok: false, error: DecisionError.ALREADY_RECORDED };
	}

	const open = nextDecisionPoint(config, maps, status);
	if (!open) return { ok: false, error: DecisionError.NO_OPEN_DECISION };

	if (open.point !== decision.point) {
		return { ok: false, error: DecisionError.WRONG_DECISION_POINT };
	}

	if (open.slot !== slot) {
		return { ok: false, error: DecisionError.WRONG_TEAM };
	}

	const validated = validateDecision(input, decision);
	if (validated !== null) {
		return { ok: false, error: validated };
	}

	const recorded: RecordedDecision = {
		point: decision.point,
		slot,
		value: decisionValue(decision),
		automatic: actor.type === 'automatic',
		actorUserId: actor.type === 'automatic' ? null : actor.userId,
		createdAt: now
	};

	const updated: RoomMapState = {
		...currentMap,
		decisions: [...currentMap.decisions, recorded],
		mapId: decision.point === DecisionPoint.MAP_PICK ? decision.mapId : currentMap.mapId,
		decisionsCompletedAt:
			decision.point === DecisionPoint.SECOND_BAN ? now : currentMap.decisionsCompletedAt
	};

	return { ok: true, map: updated, decision: recorded };
}

function validateDecision(
	input: ApplyDecisionInput,
	decision: DecisionInput
): DecisionError | null {
	const { config, maps, catalog } = input;

	switch (decision.point) {
		case DecisionPoint.MAP_PICK: {
			if (config.mapType === PickBanMapType.FIXED) return DecisionError.WRONG_DECISION_POINT;

			const eligible = eligibleMaps({ config, maps, catalog: catalog.maps });
			if (!eligible.some((entry) => entry.id === decision.mapId)) {
				return DecisionError.INVALID_MAP;
			}

			return null;
		}

		case DecisionPoint.BAN_ORDER:
			if (!config.allowConcedeFirstBan) return DecisionError.CONCEDE_NOT_ALLOWED;
			return null;

		case DecisionPoint.FIRST_BAN:
		case DecisionPoint.SECOND_BAN: {
			const eligible = eligibleHeroes({ maps, slot: input.slot, catalog: catalog.heroes });

			if (!eligible.some((entry) => entry.id === decision.heroId)) {
				return DecisionError.INVALID_HERO;
			}

			return null;
		}

		default:
			return DecisionError.WRONG_DECISION_POINT;
	}
}

function decisionValue(decision: DecisionInput): DecisionValue {
	switch (decision.point) {
		case DecisionPoint.MAP_PICK:
			return { mapId: decision.mapId };
		case DecisionPoint.BAN_ORDER:
			return { concede: decision.concede };
		case DecisionPoint.FIRST_BAN:
		case DecisionPoint.SECOND_BAN:
			return { heroId: decision.heroId };
	}
}

/**
 * Chooses the fallback decision for the open decision point:
 * - ban order: do not concede, so the first-ban team bans first;
 * - map pick: a uniformly random eligible map;
 * - hero ban: a uniformly random eligible hero.
 */
export function fallbackDecision(input: FallbackInput): FallbackResult {
	const status = input.status ?? RoomState.IN_PROGRESS;

	const open = nextDecisionPoint(input.config, input.maps, status);
	if (!open) return { ok: false, error: DecisionError.NO_OPEN_DECISION };

	const random = input.random ?? Math.random;

	switch (open.point) {
		case DecisionPoint.BAN_ORDER:
			return {
				ok: true,
				slot: open.slot,
				decision: { point: DecisionPoint.BAN_ORDER, concede: false }
			};

		case DecisionPoint.MAP_PICK: {
			const eligible = eligibleMaps({
				config: input.config,
				maps: input.maps,
				catalog: input.catalog.maps
			});

			if (eligible.length === 0) return { ok: false, error: DecisionError.NO_ELIGIBLE_MAP };

			const map = randomItem(eligible, random);
			return {
				ok: true,
				slot: open.slot,
				decision: { point: DecisionPoint.MAP_PICK, mapId: map.id }
			};
		}

		case DecisionPoint.FIRST_BAN:
		case DecisionPoint.SECOND_BAN: {
			const eligible = eligibleHeroes({
				maps: input.maps,
				slot: open.slot,
				catalog: input.catalog.heroes
			});

			if (eligible.length === 0) return { ok: false, error: DecisionError.NO_ELIGIBLE_HERO };

			const hero = randomItem(eligible, random);

			return {
				ok: true,
				slot: open.slot,
				decision: { point: open.point, heroId: hero.id }
			};
		}
	}
}

/** Applies the timeout fallback as an automatic decision. */
export function applyTimeoutFallback(input: FallbackInput & { now: number }): ApplyDecisionResult {
	const fallback = fallbackDecision(input);
	if (!fallback.ok) return { ok: false, error: fallback.error };

	return applyDecision({
		config: input.config,
		maps: input.maps,
		catalog: input.catalog,
		slot: fallback.slot,
		decision: fallback.decision,
		actor: { type: 'automatic' },
		now: input.now,
		status: input.status
	});
}

/** Returns the deadline for a decision point that was opened at `openedAt`. */
export function decisionDeadline(openedAt: number, config: ResolvedPickBanConfig): number {
	return openedAt + config.decisionTimeoutSeconds * 1000;
}

/** Whether a server-authoritative deadline has passed. */
export function isDeadlinePassed(deadlineAt: number, now: number): boolean {
	return now >= deadlineAt;
}

function randomItem<T>(items: readonly T[], random: () => number): T {
	const index = Math.min(items.length - 1, Math.floor(random() * items.length));
	return items[index];
}
