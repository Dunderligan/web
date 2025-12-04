import { asc, desc, type ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { schema } from '$lib/server/db';

export const leagueQuery = {
	columns: {
		id: true,
		name: true,
		slug: true
	}
} as const;

export const nestedDivisionQuery = {
	...leagueQuery,
	with: {
		season: {
			columns: {
				legacyRanks: true,
				...leagueQuery.columns
			}
		}
	}
} as const;

export const nestedGroupQuery = {
	...leagueQuery,
	with: {
		division: nestedDivisionQuery
	}
} as const;

export const matchRosterQuery = leagueQuery;

export const matchOrdering = [
	asc(schema.match.played), // planned matches first
	desc(schema.match.playedAt), // played matches by most recent first
	asc(schema.match.scheduledAt) // order planned by nearest scheduled first
];

export const fullMatchQuery = {
	id: true,
	teamAScore: true,
	teamBScore: true,
	draws: true,
	rosterAId: true,
	rosterBId: true,
	nextMatchId: true,
	played: true,
	vodUrl: true,
	playedAt: true,
	scheduledAt: true
} as const;

export type Transaction = PgTransaction<
	PostgresJsQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;
