import { MatchSlot, Role } from '$lib/types';
import { DEFAULT_PICK_BAN_CONFIG, type ResolvedPickBanConfig } from './config';
import {
	DecisionPoint,
	MapOutcome,
	RoomMapReportState,
	type DecisionValue,
	type HeroCatalogEntry,
	type MapCatalogEntry,
	type RecordedDecision,
	type RoomMapState
} from './types';

export const GAMEMODE = {
	control: 'gamemode-control',
	escort: 'gamemode-escort',
	hybrid: 'gamemode-hybrid'
} as const;

export const MAP = {
	antarctic: 'map-antarctic',
	busan: 'map-busan',
	dorado: 'map-dorado',
	rialto: 'map-rialto',
	kingsRow: 'map-kings-row',
	midtown: 'map-midtown'
} as const;

export const HERO = {
	rein: 'hero-rein',
	winston: 'hero-winston',
	tracer: 'hero-tracer',
	genji: 'hero-genji',
	ana: 'hero-ana',
	kiriko: 'hero-kiriko'
} as const;

export const maps: MapCatalogEntry[] = [
	map(MAP.antarctic, 'antarctic-peninsula', GAMEMODE.control),
	map(MAP.busan, 'busan', GAMEMODE.control),
	map(MAP.dorado, 'dorado', GAMEMODE.escort),
	map(MAP.rialto, 'rialto', GAMEMODE.escort),
	map(MAP.kingsRow, 'kings-row', GAMEMODE.hybrid),
	map(MAP.midtown, 'midtown', GAMEMODE.hybrid)
];

export const heroes: HeroCatalogEntry[] = [
	hero(HERO.rein, 'reinhardt', Role.TANK),
	hero(HERO.winston, 'winston', Role.TANK),
	hero(HERO.tracer, 'tracer', Role.DAMAGE),
	hero(HERO.genji, 'genji', Role.DAMAGE),
	hero(HERO.ana, 'ana', Role.SUPPORT),
	hero(HERO.kiriko, 'kiriko', Role.SUPPORT)
];

export const catalog = { maps, heroes };

export function map(id: string, slug: string, gamemodeId: string, active = true): MapCatalogEntry {
	return { id, slug, name: slug, gamemodeId, active };
}

export function hero(id: string, slug: string, role: Role): HeroCatalogEntry {
	return { id, slug, name: slug, role };
}

export function config(partial: Partial<ResolvedPickBanConfig> = {}): ResolvedPickBanConfig {
	return { ...DEFAULT_PICK_BAN_CONFIG, ...partial };
}

export function roomMap(partial: Partial<RoomMapState> = {}): RoomMapState {
	return {
		index: 0,
		mapId: null,
		firstBanSlot: MatchSlot.A,
		decisions: [],
		reports: [],
		reportState: RoomMapReportState.PENDING,
		outcome: null,
		resultRecordedAt: null,
		resolvedById: null,
		decisionsCompletedAt: null,
		...partial
	};
}

export function decision(
	point: DecisionPoint,
	slot: MatchSlot,
	value: DecisionValue,
	automatic = false
): RecordedDecision {
	return {
		point,
		slot,
		value,
		automatic,
		actorUserId: automatic ? null : 'user',
		createdAt: new Date(1_000)
	};
}

export function mapPick(slot: MatchSlot, mapId: string): RecordedDecision {
	return decision(DecisionPoint.MAP_PICK, slot, { mapId });
}

export function banOrder(slot: MatchSlot, concede: boolean): RecordedDecision {
	return decision(DecisionPoint.BAN_ORDER, slot, { concede });
}

export function heroBan(point: DecisionPoint, slot: MatchSlot, heroId: string): RecordedDecision {
	return decision(point, slot, { heroId });
}

/** A map with all decisions recorded and no result. */
export function completedMap(overrides: Partial<RoomMapState> = {}): RoomMapState {
	const base = roomMap({
		mapId: MAP.dorado,
		decisions: [
			mapPick(MatchSlot.A, MAP.dorado),
			banOrder(MatchSlot.A, false),
			heroBan(DecisionPoint.FIRST_BAN, MatchSlot.A, HERO.rein),
			heroBan(DecisionPoint.SECOND_BAN, MatchSlot.B, HERO.tracer)
		],
		decisionsCompletedAt: new Date(2_000),
		...overrides
	});

	return base;
}

/** A completed map with a recorded result. */
export function resultedMap(
	outcome: MapOutcome,
	overrides: Partial<RoomMapState> = {}
): RoomMapState {
	return completedMap({
		outcome,
		resultRecordedAt: new Date(3_000),
		resolvedById: null,
		...overrides
	});
}
