import {
	pgTable,
	text,
	timestamp,
	boolean,
	uuid,
	pgEnum,
	integer,
	unique,
	primaryKey
} from 'drizzle-orm/pg-core';
import { enumToPgEnum, timestamps } from './helpers';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: boolean()
		.$defaultFn(() => false)
		.notNull(),
	image: text(),
	createdAt: timestamp()
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp()
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const session = pgTable('session', {
	id: text().primaryKey(),
	expiresAt: timestamp().notNull(),
	token: text().notNull().unique(),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('account', {
	id: text().primaryKey(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp(),
	refreshTokenExpiresAt: timestamp(),
	scope: text(),
	password: text(),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull()
});

export const verification = pgTable('verification', {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp().notNull(),
	createdAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()),
	updatedAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date())
});

export const season = pgTable('season', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	...timestamps
});

export const seasonRelations = relations(season, ({ many }) => ({
	divisions: many(division)
}));

export const division = pgTable('division', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	seasonId: uuid()
		.notNull()
		.references(() => season.id, { onDelete: 'cascade' }),
	...timestamps
});

export const divisionRelations = relations(division, ({ one, many }) => ({
	season: one(season),
	groups: many(group)
}));

export const group = pgTable('group', {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	divisionId: uuid()
		.notNull()
		.references(() => division.id, { onDelete: 'cascade' }),
	...timestamps
});

export const groupRelations = relations(group, ({ one }) => ({
	division: one(division)
}));

export const team = pgTable('team', {
	id: uuid().primaryKey().defaultRandom(),
	slug: text().notNull().unique(),
	...timestamps
});

export const teamRelations = relations(team, ({ many }) => ({
	rosters: many(roster),
	socials: many(social)
}));

export const roster = pgTable('roster', {
	id: uuid().primaryKey().notNull(),
	name: text().notNull(),
	teamId: uuid()
		.notNull()
		.references(() => team.id, { onDelete: 'cascade' }),
	...timestamps
});

export const rosterRelations = relations(roster, ({ one }) => ({
	team: one(team)
}));

export enum SocialPlatform {
	YOUTUBE = 'youtube',
	TWITTER = 'twitter'
}

export const socialPlatformEnum = pgEnum('social_platform', enumToPgEnum(SocialPlatform));

export const social = pgTable(
	'social',
	{
		id: uuid().primaryKey().notNull(),
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
	team: one(team)
}));

export const player = pgTable('player', {
	id: uuid().primaryKey().notNull(),
	battletag: text().notNull().unique(),
	...timestamps
});

export enum Rank {
	BRONZE = 'bronze',
	SILVER = 'silver',
	GOLD = 'gold',
	PLATINUM = 'platinum',
	DIAMOND = 'diamond',
	MASTER = 'master',
	GRANDMASTER = 'grandmaster',
	CHAMPION = 'champion'
}

export const rankEnum = pgEnum('rank', enumToPgEnum(Rank));

export enum Role {
	DAMAGE = 'damage',
	TANK = 'tank',
	SUPPORT = 'support'
}

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
	(t) => [primaryKey({ columns: [t.playerId, t.rosterId] })]
);
