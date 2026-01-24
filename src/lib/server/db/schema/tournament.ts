import {
	pgTable,
	text,
	boolean,
	uuid,
	pgEnum,
	integer,
	unique,
	primaryKey,
	timestamp,
	type AnyPgColumn,
	check
} from 'drizzle-orm/pg-core';
import { timestamps, enumToPgEnum } from './util';
import { and, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { MatchState, MatchType, Rank, Role, SocialPlatform } from '../../../types';

export const season = pgTable('season', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	startedAt: timestamp().notNull(),
	endedAt: timestamp(),
	legacyRanks: boolean().notNull().default(false),
	hidden: boolean().notNull().default(false),
	...timestamps
});

export const division = pgTable(
	'division',
	{
		id: uuid().primaryKey().defaultRandom(),
		name: text().notNull(),
		slug: text().notNull(),
		playoffLine: integer(),
		groupwiseStandings: boolean().notNull().default(false),
		seasonId: uuid()
			.notNull()
			.references(() => season.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(t) => [unique().on(t.slug, t.seasonId)]
);

export const group = pgTable(
	'group',
	{
		id: uuid().primaryKey().defaultRandom(),
		name: text().notNull(),
		slug: text().notNull(),
		divisionId: uuid()
			.notNull()
			.references(() => division.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(t) => [unique().on(t.slug, t.divisionId)]
);

export const team = pgTable('team', {
	id: uuid().primaryKey().defaultRandom(),
	...timestamps
});

export const roster = pgTable(
	'roster',
	{
		id: uuid().primaryKey().defaultRandom(),
		name: text().notNull(),
		slug: text().notNull(),
		seasonSlug: text().notNull(),
		teamId: uuid()
			.notNull()
			.references(() => team.id, { onDelete: 'cascade' }),
		groupId: uuid()
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		resigned: boolean().notNull().default(false),
		...timestamps
	},
	(t) => [unique().on(t.slug, t.seasonSlug), unique().on(t.teamId, t.seasonSlug)]
);

export const socialPlatformEnum = pgEnum('social_platform', enumToPgEnum(SocialPlatform));

export const social = pgTable(
	'social',
	{
		id: uuid().primaryKey().defaultRandom(),
		platform: socialPlatformEnum().notNull(),
		url: text().notNull(),
		teamId: uuid()
			.notNull()
			.references(() => team.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(t) => [unique().on(t.teamId, t.platform)]
);

export const player = pgTable('player', {
	id: uuid().primaryKey().defaultRandom(),
	battletag: text().notNull().unique(),
	...timestamps
});

export const rankEnum = pgEnum('rank', enumToPgEnum(Rank));

export const roleEnum = pgEnum('role', enumToPgEnum(Role));

export const matchStateEnum = pgEnum('match_state', enumToPgEnum(MatchState));

export const member = pgTable(
	'member',
	{
		playerId: uuid()
			.notNull()
			.references(() => player.id, { onDelete: 'cascade' }),
		rosterId: uuid()
			.notNull()
			.references(() => roster.id, { onDelete: 'cascade' }),
		rank: rankEnum(),
		tier: integer(),
		sr: integer(),
		role: roleEnum().notNull(),
		isCaptain: boolean().notNull().default(false),
		...timestamps
	},
	(t) => [
		primaryKey({ columns: [t.playerId, t.rosterId] }),
		check('tier_range', sql`${t.tier} >= 1 AND ${t.tier} <= 5`),
		check('not_both_legacy_sr_and_tier', or(isNull(t.sr), isNull(t.tier))!)
	]
);

export const matchType = pgEnum('match_type', enumToPgEnum(MatchType));

export const match = pgTable(
	'match',
	{
		id: uuid().primaryKey().defaultRandom(),
		/** The match's group. Must be set for group-stage matches, null otherwise. */
		groupId: uuid().references(() => group.id, { onDelete: 'cascade' }),
		bracketId: uuid().references(() => bracket.id, { onDelete: 'cascade' }),
		rosterAId: uuid().references(() => roster.id, { onDelete: 'set null' }),
		rosterBId: uuid().references(() => roster.id, { onDelete: 'set null' }),
		teamAScore: integer().notNull().default(0),
		teamBScore: integer().notNull().default(0),
		draws: integer().notNull().default(0),
		teamANote: text(),
		teamBNote: text(),
		state: matchStateEnum().notNull().default(MatchState.SCHEDULED),
		playedAt: timestamp(),
		scheduledAt: timestamp(),
		vodUrl: text(),
		/** The next match in the bracket, if any. */
		nextMatchId: uuid().references((): AnyPgColumn => match.id, {
			onDelete: 'set null'
		}),
		/** The vertical order to display this match in a bracket. Ignored for group-stage matches. */
		order: integer().notNull().default(0),
		...timestamps
	},
	(t) => [
		check(
			'group_xor_bracket',
			and(
				or(isNull(t.groupId), isNull(t.bracketId)),
				or(isNotNull(t.groupId), isNotNull(t.bracketId))
			)!
		)
	]
);

export const bracket = pgTable('bracket', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	divisionId: uuid()
		.notNull()
		.references(() => division.id, { onDelete: 'cascade' }),
	...timestamps
});
