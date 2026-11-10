import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { enumToPgEnum } from './util';
import { bracket, division, match, matchSlotEnum } from './tournament';
import { user } from './auth';
import {
	DecisionPoint,
	MapOutcome,
	PickBanMapType,
	RoomCloseReason,
	RoomMapReportState,
	RoomState,
	WinCondition,
	type DecisionValue
} from '../../../pick-ban/types';
import type { ResolvedPickBanConfig } from '../../../pick-ban/config';

export const gamemode = pgTable('gamemode', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	active: boolean().notNull().default(true)
});

export const map = pgTable(
	'map',
	{
		id: uuid().primaryKey().defaultRandom(),
		name: text().notNull(),
		slug: text().notNull().unique(),
		gamemodeId: uuid()
			.notNull()
			.references(() => gamemode.id, { onDelete: 'cascade' }),
		active: boolean().notNull().default(true)
	},
	(t) => [index('map_gamemode_id_idx').on(t.gamemodeId)]
);

export const winConditionEnum = pgEnum('win_condition', enumToPgEnum(WinCondition));
export const mapTypeEnum = pgEnum('pick_ban_map_type', enumToPgEnum(PickBanMapType));

/**
 * Scoped pick and ban configuration. A nullable scope dimension means "any".
 * Exactly one row may exist per effective scope (nulls are treated as equal).
 */
export const pickBanConfig = pgTable(
	'pick_ban_config',
	{
		id: uuid().primaryKey().defaultRandom(),
		divisionId: uuid().references(() => division.id, { onDelete: 'cascade' }),
		bracketId: uuid().references(() => bracket.id, { onDelete: 'cascade' }),

		round: integer(),
		enabled: boolean(),
		decisionTimeoutSeconds: integer(),
		allowConcedeFirstBan: boolean(),
		winCondition: winConditionEnum(),
		mapCount: integer(),
		mapType: mapTypeEnum(),
		setAllowedMapIds: boolean().notNull().default(false),
		allowedMapIds: uuid().array(),
		setAllowedGamemodeIds: boolean().notNull().default(false),
		allowedGamemodeIds: uuid().array(),
		setFirstGamemodeId: boolean().notNull().default(false),
		firstGamemodeId: uuid().references(() => gamemode.id, { onDelete: 'set null' }),
		restrictUsedGamemodes: boolean(),
		fixedMapIds: uuid().array()
	},
	(t) => [
		unique('pick_ban_config_scope_key').on(t.divisionId, t.bracketId, t.round).nullsNotDistinct(),
		check('pick_ban_config_map_count', sql`${t.mapCount} is null or ${t.mapCount} >= 1`),
		check(
			'pick_ban_config_timeout',
			sql`${t.decisionTimeoutSeconds} is null or ${t.decisionTimeoutSeconds} >= 1`
		),
		check('pick_ban_config_round', sql`${t.round} is null or ${t.round} >= 0`)
	]
);

export const roomStateEnum = pgEnum('room_state', enumToPgEnum(RoomState));
export const roomCloseReasonEnum = pgEnum('room_close_reason', enumToPgEnum(RoomCloseReason));

/** The live pick-ban session for one match. */
export const room = pgTable(
	'room',
	{
		id: uuid().primaryKey().defaultRandom(),
		matchId: uuid()
			.notNull()
			.references(() => match.id, { onDelete: 'cascade' }),
		state: roomStateEnum().notNull().default(RoomState.OPEN),
		/** Incremented in the same transaction as every committed state change. */
		version: integer().notNull().default(0),
		/** A snapshot of the configuration at room creation, so that config edits cannot rewrite history. */
		configSnapshot: jsonb().$type<ResolvedPickBanConfig>().notNull(),
		/** Seed/placement snapshot used for the first map's first-ban team. */
		teamASeed: integer().notNull(),
		teamBSeed: integer().notNull(),
		currentMapIndex: integer().notNull().default(0),
		/** Server-authoritative deadline for the open decision point, or null when none is open. */
		nextDeadlineAt: timestamp({ withTimezone: true }),
		closeReason: roomCloseReasonEnum(),
		closedAt: timestamp({ withTimezone: true }),
		createdById: uuid().references(() => user.id, { onDelete: 'set null' }),
		cancelledById: uuid().references(() => user.id, { onDelete: 'set null' }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('room_one_active_per_match_idx')
			.on(t.matchId)
			.where(sql`${t.state} in ('open', 'ready_check', 'in_progress')`),
		index('room_next_deadline_at_idx').on(t.nextDeadlineAt),
		index('room_state_idx').on(t.state),
		check('room_seeds', sql`${t.teamASeed} >= 0 and ${t.teamBSeed} >= 0`),
		check('room_current_map_index', sql`${t.currentMapIndex} >= 0`)
	]
);

export const roomMapReportStateEnum = pgEnum(
	'room_map_report_state',
	enumToPgEnum(RoomMapReportState)
);
export const mapOutcomeEnum = pgEnum('map_outcome', enumToPgEnum(MapOutcome));

/** One map (game) within a room. */
export const roomMap = pgTable(
	'room_map',
	{
		id: uuid().primaryKey().defaultRandom(),
		roomId: uuid()
			.notNull()
			.references(() => room.id, { onDelete: 'cascade' }),
		/** Zero-based game index within the match. */
		mapIndex: integer().notNull(),
		/** Null until the map is picked or assigned from a fixed pool. */
		mapId: uuid().references(() => map.id, { onDelete: 'restrict' }),
		firstBanSlot: matchSlotEnum().notNull(),
		reportState: roomMapReportStateEnum().notNull().default(RoomMapReportState.PENDING),
		resultOutcome: mapOutcomeEnum(),
		decisionsCompletedAt: timestamp({ withTimezone: true }),
		resultRecordedAt: timestamp({ withTimezone: true }),
		/** An admin who resolved a disputed map report, or reported the result before the team captains did. */
		resolvedById: uuid().references(() => user.id, { onDelete: 'set null' }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		unique('room_map_room_index_key').on(t.roomId, t.mapIndex),
		index('room_map_room_id_idx').on(t.roomId),
		index('room_map_map_id_idx').on(t.mapId),
		check('room_map_index', sql`${t.mapIndex} >= 0`)
	]
);

export const decisionPointEnum = pgEnum('decision_point', enumToPgEnum(DecisionPoint));

/** Append-only decision log. Exactly one decision is recorded per room map and decision point. */
export const roomDecision = pgTable(
	'room_decision',
	{
		id: uuid().primaryKey().defaultRandom(),
		roomMapId: uuid()
			.notNull()
			.references(() => roomMap.id, { onDelete: 'cascade' }),
		point: decisionPointEnum().notNull(),
		slot: matchSlotEnum().notNull(),
		value: jsonb().$type<DecisionValue>().notNull(),
		/** True when the server took the decision because the timer expired. */
		automatic: boolean().notNull().default(false),
		/** The acting captain or admin. Null for automatic decisions and deleted users. */
		actorUserId: uuid().references(() => user.id, { onDelete: 'set null' }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		unique('room_decision_point_key').on(t.roomMapId, t.point),
		index('room_decision_room_map_id_idx').on(t.roomMapId)
	]
);

/** A captain's independent per-map result report. */
export const roomReport = pgTable(
	'room_report',
	{
		id: uuid().primaryKey().defaultRandom(),
		roomMapId: uuid()
			.notNull()
			.references(() => roomMap.id, { onDelete: 'cascade' }),
		slot: matchSlotEnum().notNull(),
		outcome: mapOutcomeEnum().notNull(),
		submittedById: uuid().references(() => user.id, { onDelete: 'set null' }),
		submittedAt: timestamp({ withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		unique('room_report_map_slot_key').on(t.roomMapId, t.slot),
		index('room_report_room_map_id_idx').on(t.roomMapId)
	]
);
