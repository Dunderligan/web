import { eq, type ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction, timestamp } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { db, schema } from '.';

export const timestamps = {
	createdAt: timestamp().defaultNow().notNull()
};

export const nestedGroupQuery = {
	group: {
		columns: {
			id: true,
			name: true,
			slug: true
		},
		with: {
			division: {
				columns: {
					id: true,
					name: true,
					slug: true
				},
				with: {
					season: {
						columns: {
							id: true,
							name: true,
							slug: true
						}
					}
				}
			}
		}
	}
} as const;

export type Transaction = PgTransaction<
	PostgresJsQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;
