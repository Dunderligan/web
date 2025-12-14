import { sql, eq } from 'drizzle-orm';
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

export const groupMatchOrder = {
	played: 'asc', // planned matches first
	playedAt: 'desc', // played matches by most recent first
	scheduledAt: 'asc' // order planned by nearest scheduled first
} as const;

export const fullMatchColumns = {
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

export type Transaction = PgTransaction<PostgresJsQueryResultHKT, typeof schema>;

export function rolesOrder(column: any) {
	return sql`(
		CASE ${column}
			WHEN 'tank' THEN 1
			WHEN 'damage' THEN 2
			WHEN 'support' THEN 3
			WHEN 'flex' THEN 4
			WHEN 'coach' THEN 5
			ELSE 6 END
	) ASC`;
}

export async function findOrCreatePlayer(tx: Transaction, battletag: string) {
	const name = battletag.split('#')[0];

	const [existingPlayer] = await tx
		.select()
		.from(schema.player)
		.where(eq(sql<string>`SPLIT_PART(${schema.player.battletag}, '#', 1)`, name));

	if (existingPlayer) {
		if (name !== battletag && existingPlayer.battletag !== battletag) {
			// if we got a number tag and the exisitng player doesn't, store the new one
			await tx
				.update(schema.player)
				.set({ battletag })
				.where(eq(schema.player.id, existingPlayer.id));
		}

		return existingPlayer.id;
	} else {
		const [newPlayer] = await tx.insert(schema.player).values({ battletag }).returning();

		return newPlayer.id;
	}
}
