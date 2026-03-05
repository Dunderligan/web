import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { enumToPgEnum, timestamps } from './util';
import { AuthRole } from '../../../authRole';

export const authRole = pgEnum('auth_role', enumToPgEnum(AuthRole));

export const user = pgTable('user', {
	id: uuid().defaultRandom().primaryKey(),
	battletag: text().notNull().unique(),
	battlenetId: integer().notNull().unique(),
	role: authRole().notNull().default(AuthRole.USER),
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
