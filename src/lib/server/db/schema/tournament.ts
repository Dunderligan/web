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
import { timestamps } from '../helpers';
import { relations, sql } from 'drizzle-orm';
import { MatchType, Rank, Role, SocialPlatform } from '../../../types';
import { enumToPgEnum } from '../../../util';

export const season = pgTable('season', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	startedAt: timestamp().notNull(),
	endedAt: timestamp(),
	...timestamps
});

export const seasonRelations = relations(season, ({ many }) => ({
	divisions: many(division)
}));

export const division = pgTable(
	'division',
	{
		id: uuid().primaryKey().defaultRandom(),
		name: text().notNull(),
		slug: text().notNull(),
		seasonId: uuid()
			.notNull()
			.references(() => season.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(t) => [unique().on(t.slug, t.seasonId)]
);

export const divisionRelations = relations(division, ({ one, many }) => ({
	season: one(season, {
		fields: [division.seasonId],
		references: [season.id]
	}),
	groups: many(group),
	matches: many(match)
}));

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

export const groupRelations = relations(group, ({ one, many }) => ({
	division: one(division, {
		fields: [group.divisionId],
		references: [division.id]
	}),
	rosters: many(roster),
	matches: many(match)
}));

export const team = pgTable('team', {
	id: uuid().primaryKey().defaultRandom(),
	...timestamps
});

export const teamRelations = relations(team, ({ many }) => ({
	rosters: many(roster),
	socials: many(social)
}));

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
		...timestamps
	},
	(t) => [unique().on(t.slug, t.seasonSlug), unique().on(t.teamId, t.seasonSlug)]
);

export const rosterRelations = relations(roster, ({ one, many }) => ({
	team: one(team, {
		fields: [roster.teamId],
		references: [team.id]
	}),
	group: one(group, {
		fields: [roster.groupId],
		references: [group.id]
	}),
	members: many(member),
	matches: many(match)
}));

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

export const socialRelations = relations(social, ({ one }) => ({
	team: one(team, {
		fields: [social.teamId],
		references: [team.id]
	})
}));

export const player = pgTable('player', {
	id: uuid().primaryKey().defaultRandom(),
	battletag: text().notNull().unique(),
	...timestamps
});

export const playerRelations = relations(player, ({ many }) => ({
	memberships: many(member)
}));

export const rankEnum = pgEnum('rank', enumToPgEnum(Rank));

export const roleEnum = pgEnum('role', enumToPgEnum(Role));

export const member = pgTable(
	'member',
	{
		playerId: uuid()
			.notNull()
			.references(() => player.id, { onDelete: 'cascade' }),
		rosterId: uuid()
			.notNull()
			.references(() => roster.id, { onDelete: 'cascade' }),
		rank: rankEnum().notNull(),
		tier: integer().notNull(),
		role: roleEnum().notNull(),
		isCaptain: boolean().notNull().default(false),
		...timestamps
	},
	(t) => [
		primaryKey({ columns: [t.playerId, t.rosterId] }),
		check('tier', sql`${t.tier} >= 1 AND ${t.tier} <= 5`)
	]
);

export const memberRelations = relations(member, ({ one }) => ({
	player: one(player, {
		fields: [member.playerId],
		references: [player.id]
	}),
	roster: one(roster, {
		fields: [member.rosterId],
		references: [roster.id]
	})
}));

export const matchType = pgEnum('match_type', enumToPgEnum(MatchType));

export const match = pgTable('match', {
	id: uuid().primaryKey().defaultRandom(),
	// for group matches
	groupId: uuid().references(() => group.id, { onDelete: 'cascade' }),
	// for bracket matches
	divisionId: uuid().references(() => division.id, { onDelete: 'cascade' }),
	rosterAId: uuid().references(() => roster.id, { onDelete: 'set null' }),
	rosterBId: uuid().references(() => roster.id, { onDelete: 'set null' }),
	teamAScore: integer(),
	teamBScore: integer(),
	draws: integer(),
	played: boolean().notNull().default(false),
	playedAt: timestamp(),
	scheduledAt: timestamp(),
	vodUrl: text(),
	nextMatchId: uuid().references((): AnyPgColumn => match.id, { onDelete: 'set null' }),
	order: integer().notNull().default(0),
	...timestamps
});

export const matchRelations = relations(match, ({ one }) => ({
	rosterA: one(roster, {
		fields: [match.rosterAId],
		references: [roster.id],
		relationName: 'rosterA'
	}),
	rosterB: one(roster, {
		fields: [match.rosterBId],
		references: [roster.id],
		relationName: 'rosterB'
	}),
	group: one(group, {
		fields: [match.groupId],
		references: [group.id]
	}),
	division: one(division, {
		fields: [match.divisionId],
		references: [division.id]
	})
}));
