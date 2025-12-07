import { db, schema } from '$lib/server/db';
import { matchOrdering, matchRosterQuery } from '$lib/server/db/helpers';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export const load = async ({ params, url }) => {
	const rosterIds = url.searchParams.get('rosters')?.split(',') ?? [];
	const seasonId = url.searchParams.get('sasong');
	const divisionId = url.searchParams.get('division');
	const groupId = url.searchParams.get('grupp');

	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	if (offset < 0) {
		error(400);
	}
	const limit = parseInt(url.searchParams.get('antal') ?? '10');
	if (limit < 1 || limit > 50) {
		error(400);
	}

	const rosterA = alias(schema.roster, 'rosterA');
	const rosterB = alias(schema.roster, 'rosterB');

	let query = db
		.select({
			match: schema.match,
			rosterA,
			rosterB,
			season: schema.season,
			divisionId: schema.division.id,
			groupId: schema.group.id
		})
		.from(schema.match)
		.offset(offset)
		.limit(limit)
		.orderBy(...matchOrdering)
		.innerJoin(rosterA, eq(schema.match.rosterAId, rosterA.id))
		.innerJoin(rosterB, eq(schema.match.rosterBId, rosterB.id))
		.leftJoin(schema.group, eq(schema.match.groupId, schema.group.id))
		// .leftJoin(schema.division, eq(schema.group.divisionId, schema.division.id))
		.leftJoin(schema.division, eq(schema.match.divisionId, schema.division.id))
		.leftJoin(schema.season, eq(schema.division.seasonId, schema.season.id))
		.$dynamic();

	if (rosterIds) {
		for (const rosterId of rosterIds) {
			query = query.where(
				or(eq(schema.match.rosterAId, rosterId), eq(schema.match.rosterBId, rosterId))
			);
		}
	}

	if (seasonId) {
		query = query.where(eq(schema.season.id, seasonId));
	}

	if (divisionId) {
		query = query.where(eq(schema.division.id, divisionId));
	}

	if (groupId) {
		query = query.where(eq(schema.group.id, groupId));
	}

	const matches = await query;

	return { matches, query: { offset, limit, rosterIds, seasonId, divisionId, groupId } };
};
