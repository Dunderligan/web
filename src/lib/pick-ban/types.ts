import { MatchSlot, type Role } from '../types';

export enum PickBanMapType {
	FIXED = 'fixed',
	POOL = 'pool'
}

/** The two win-condition formats a match can use. */
export enum WinCondition {
	/** First team to `mapCount` map wins. Draws do not count toward either team's wins. */
	FIRST_TO = 'first_to',
	/** Exactly `mapCount` maps are played. Draws count as one of the maps. */
	FIXED_MAPS = 'fixed_maps'
}

/** The lifecycle state of a room. */
export enum RoomState {
	OPEN = 'open',
	READY_CHECK = 'ready_check',
	IN_PROGRESS = 'in_progress',
	FINISHED = 'finished',
	CANCELLED = 'cancelled'
}

/** Why a room was closed. Rooms that are auto-deleted are removed instead of closed. */
export enum RoomCloseReason {
	FINISHED = 'finished',
	CANCELLED = 'cancelled'
}

/** The report state of a single map. */
export enum RoomMapReportState {
	PENDING = 'pending',
	AGREED = 'agreed',
	DISPUTED = 'disputed',
	RESOLVED = 'resolved'
}

/** A single required action during a map's pick and ban phase. */
export enum DecisionPoint {
	MAP_PICK = 'map_pick',
	BAN_ORDER = 'ban_order',
	FIRST_BAN = 'first_ban',
	SECOND_BAN = 'second_ban'
}

/** The recorded outcome of a single map. */
export enum MapOutcome {
	TEAM_A = 'a',
	TEAM_B = 'b',
	DRAW = 'draw'
}

/** The value of a recorded decision. Which member is present depends on the decision point. */
export type DecisionValue = { mapId: string } | { concede: boolean } | { heroId: string };

/** A single, append-only decision in a room. */
export type RecordedDecision = {
	point: DecisionPoint;
	slot: MatchSlot;
	value: DecisionValue;
	/** True when the decision was taken by the server because the timer expired. */
	automatic: boolean;
	/** The acting user, or null for automatic decisions and decisions whose user has been deleted. */
	actorUserId: string | null;
	createdAt: Date;
};

/** A captain's independent report of a map result. */
export type MapReport = {
	slot: MatchSlot;
	outcome: MapOutcome;
	submittedById: string | null;
	submittedAt: Date;
};

/** The recorded result of a map, either agreed by both captains or set by an admin. */
export type MapResult = {
	outcome: MapOutcome;
	recordedAt: Date;
	/** The admin who resolved the result, or null when the captains agreed. */
	resolvedById: string | null;
};

/** The pure state of one map in a room. */
export type RoomMapState = {
	/** Zero-based game index within the match. */
	index: number;
	/** Null until the map has been picked or assigned by a fixed map pool. */
	mapId: string | null;
	/** The team that holds the first ban (and therefore the map pick) on this map. */
	firstBanSlot: MatchSlot;
	decisions: RecordedDecision[];
	reports: MapReport[];
	reportState: RoomMapReportState;
	result: MapResult | null;
	decisionsCompletedAt: Date | null;
};

/** A gamemode in the map catalogue. */
export type GamemodeCatalogEntry = {
	id: string;
	slug: string;
	name: string;
	active: boolean;
};

/** A map in the map catalogue. */
export type MapCatalogEntry = {
	id: string;
	slug: string;
	name: string;
	gamemodeId: string;
	active: boolean;
};

/** A hero in the hero catalogue. Heroes have no active flag; all heroes are always ban candidates. */
export type HeroCatalogEntry = {
	id: string;
	slug: string;
	name: string;
	role: Role;
};

/** The catalogue data needed by the pure rule engine. */
export type RuleCatalog = {
	maps: readonly MapCatalogEntry[];
	heroes: readonly HeroCatalogEntry[];
};

/** The seeds used to determine the first-ban team on the first map. Seed 1 is the strongest team. */
export type SeedPair = {
	a: number | null;
	b: number | null;
};
