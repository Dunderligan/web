import { sql, eq } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { schema } from '$lib/server/db';
import type { User } from './schema/auth';

// Helper queries and functions for database operations.

/**
 * Query with the id, name and slug columns.
 * Commonly used for fetching for rosters, groups, brackets, divisions and seasons
 * (collectively "entities") in nested queries.
 */
// TODO: find a better name for this?
export const entityQuery = {
	columns: {
		id: true,
		name: true,
		slug: true
	}
} as const;

/**
 * Query for a division with the parent season nested.
 */
export const nestedDivisionQuery = {
	...entityQuery,
	with: {
		season: {
			columns: {
				legacyRanks: true,
				...entityQuery.columns
			}
		}
	}
} as const;

/**
 * Query for a group with the parent division (and the division's season) nested.
 */
export const nestedGroupQuery = {
	...entityQuery,
	with: {
		division: nestedDivisionQuery
	}
} as const;

/**
 * Query for a bracket with the parent division (and the division's season) nested.
 */
export const nestedBracketQuery = {
	columns: {
		id: true,
		name: true
	},
	with: {
		division: nestedDivisionQuery
	}
} as const;

/**
 * Query for the base information about a roster participating in matches.
 */
export const matchRosterQuery = entityQuery;

/**
 * Default ordering for matches within a group.
 */
export const groupMatchOrder = {
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
	teamANote: true,
	teamBNote: true,
	nextMatchId: true,
	state: true,
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
			ELSE 6 
		END
	) ASC`;
}

/**
 * An sql ordering that puts "Dunderligan" first, then alphabetically by the provided column.
 *
 * Used for sorting divisions and brackets.
 */
export function divisionOrder(column: any) {
	return sql`(
		CASE ${column}
			WHEN 'Dunderligan' THEN '0'
			ELSE ${column}
		END
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

export function canSeeHiddenSeasons(user?: User | null) {
	return user?.isAdmin ?? false;
}

export function hiddenSeasonFilter(user?: User | null) {
	return canSeeHiddenSeasons(user) ? undefined : false;
}

export function canSeeSeason(season: { hidden: boolean }, user?: User | null) {
	return !season.hidden || canSeeHiddenSeasons(user);
}
