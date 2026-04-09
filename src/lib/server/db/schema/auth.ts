import { integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { enumToPgEnum } from './util';
import { AuthRole } from '../../../authRole';

export const authRole = pgEnum('auth_role', enumToPgEnum(AuthRole));

export const user = pgTable('user', {
	id: uuid().defaultRandom().primaryKey(),
	battletag: text().notNull().unique(),
	battlenetId: integer().notNull().unique(),
	role: authRole().notNull().default(AuthRole.USER),
	createdAt: timestamp().defaultNow().notNull()
});

export const session = pgTable('session', {
	id: text().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp({ withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp().defaultNow().notNull()
});

export const apiKey = pgTable(
	'api_key',
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => user.id),
		tokenHash: text().notNull().unique(),
		name: text().notNull(),
		lastUsedAt: timestamp(),
		createdAt: timestamp().defaultNow().notNull()
	},
	(t) => [unique().on(t.userId, t.name)]
);

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type ApiKey = typeof apiKey.$inferSelect;
