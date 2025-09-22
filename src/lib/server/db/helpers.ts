import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction, timestamp } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { schema } from '.';

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

export function enumToPgEnum<T extends Record<string, any>>(
	myEnum: T
): [T[keyof T], ...T[keyof T][]] {
	return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

export type Transaction = PgTransaction<
	PostgresJsQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;
