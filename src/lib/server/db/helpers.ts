import { sql, eq } from 'drizzle-orm';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { db, schema } from '$lib/server/db';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PlayerCheckin } from '$lib/types';

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
 * Query for the base information about a season.
 */
export const nestedSeasonQuery = {
	columns: {
		legacyRanks: true,
		startedAt: true,
		spinoff: true,
		checkinOpen: true,
		...entityQuery.columns
	}
} as const;

/**
 * Query for a division with the parent season nested.
 */
export const nestedDivisionQuery = {
	...entityQuery,
	with: {
		season: nestedSeasonQuery
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
	scheduledAt: true,
	round: true
} as const;

export const fullMatchQuery = {
	columns: {
		...fullMatchColumns,
		// The IDs are already included in the joined roster objects, don't query them twice
		rosterAId: false,
		rosterBId: false
	},
	orderBy: groupMatchOrder,
	with: {
		rosterA: matchRosterQuery,
		rosterB: matchRosterQuery
	}
} as const;

export const fullMatchQueryWithContext = {
	...fullMatchQuery,
	with: {
		...fullMatchQuery.with,
		group: nestedGroupQuery,
		bracket: nestedBracketQuery
	}
} as const;

export const finalMatchQuery = {
	...fullMatchQuery,
	limit: 1,
	orderBy: {
		round: 'asc'
	}
} as const;

export const memberQueryWithoutPlayer = {
	orderBy: (t: any) => sql`${rolesOrder(t.role)}, ${t.playerId} ASC`,
	columns: {
		isCaptain: true,
		tier: true,
		rank: true,
		sr: true,
		role: true,
		registeredName: true
	}
} as const;

export const memberQuery = {
	...memberQueryWithoutPlayer,
	with: {
		player: {
			columns: {
				id: true,
				battletag: true
			}
		}
	}
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
			WHEN 'manager' THEN 6
			ELSE 7
		END
	) ASC`;
}

export function rosterSeasonFilter(seasonId: string) {
	return {
		group: {
			division: {
				season: {
					id: seasonId
				}
			}
		}
	};
}

export function isNull(isNull: boolean | null | undefined) {
	if (isNull === true) {
		return { isNull: true as true };
	} else if (isNull === false) {
		return { isNotNull: true as true };
	} else {
		return {};
	}
}

/**
 * An SQL ordering that puts "Dunderligan" and "Dunderserien" first, then alphabetically by the provided column.
 *
 * Used for sorting divisions and brackets.
 */
export function divisionOrder(column: any) {
	return sql`(
		CASE ${column}
			WHEN 'Dunderligan' THEN '0'
			WHEN 'Dunderserien' THEN '0'
			ELSE ${column}
		END
	) ASC`;
}

export async function findPlayer(battletag: string) {
	const name = battletag.split('#')[0];

	// first match only player names, case-insensitively
	const matchingPlayers = await db
		.select({
			id: schema.player.id,
			battletag: schema.player.battletag
		})
		.from(schema.player)
		.where(eq(sql`SPLIT_PART(${schema.player.battletag}, '#', 1)::citext`, name));

	if (matchingPlayers.length == 0) {
		return null;
	}

	if (battletag.includes('#')) {
		const exactMatch = matchingPlayers.find(
			(match) => match.battletag.toLowerCase() === battletag.toLowerCase()
		);

		return exactMatch ?? null;
	} else if (matchingPlayers.length === 1) {
		// if we don't have a discriminator, but there's only one matching name,
		// we don't care about the discriminator and just return that player
		return matchingPlayers[0];
	} else {
		// multiple players with the same name but no discriminator provided;
		// we can't determine which one the user meant
		return null;
	}
}

export async function findOrCreatePlayer(tx: Transaction, battletag: string) {
	const existingPlayerId = await findPlayer(battletag);
	if (existingPlayerId) {
		return existingPlayerId;
	} else {
		const [newPlayer] = await tx.insert(schema.player).values({ battletag }).returning();

		return { id: newPlayer.id, battletag };
	}
}

export async function retrievePlayerCheckins(
	seasonId: string,
	playerIds: string[]
): Promise<Map<string, PlayerCheckin>> {
	const checkins = await db.query.playerCheckin.findMany({
		where: {
			seasonId: seasonId,
			playerId: {
				in: playerIds
			}
		},
		columns: {
			playerId: true,
			checkedInAt: true,
			discordId: true
		}
	});

	return new Map(checkins.map(({ playerId, ...data }) => [playerId, data]));
}
