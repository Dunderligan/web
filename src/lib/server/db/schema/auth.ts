import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './util';

export const user = pgTable('user', {
	id: uuid().defaultRandom().primaryKey(),
	battletag: text().notNull().unique(),
	battlenetId: integer().notNull().unique(),
	isAdmin: boolean().notNull().default(false),
	isSuperAdmin: boolean().notNull().default(false),
	...timestamps
});

export const session = pgTable('session', {
	id: text().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp({ withTimezone: true, mode: 'date' }).notNull(),
	...timestamps
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
