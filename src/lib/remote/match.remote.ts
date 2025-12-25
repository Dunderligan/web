import { query } from '$app/server';
import { db, schema } from '$lib/server/db';
import {
	fullMatchColumns,
	groupMatchOrder,
	matchRosterQuery,
	nestedDivisionQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';
import z from 'zod';

const PAGE_SIZE = 10;

export const queryMatches = query(
	z.object({
		rosterId: z.uuid().optional(),
		seasonId: z.uuid().optional(),
		divisionId: z.uuid().optional(),
		groupId: z.uuid().optional(),
		played: z.boolean().optional(),
		page: z.number().min(0).default(0)
	}),
	async ({ rosterId, divisionId, groupId, played, page }) => {
		const results = await db.query.match.findMany({
			// retrieve one extra to determine if there should be a next page
			limit: PAGE_SIZE + 1,
			offset: page * PAGE_SIZE,
			orderBy: groupMatchOrder,
			where: {
				AND: [
					{
						// don't include unplayed matches without both rosters assigned
						OR: [
							{
								rosterAId: {
									isNotNull: true
								},
								rosterBId: {
									isNotNull: true
								}
							},
							{
								played: true
							}
						]
					},
					{
						// if rosterId is undefined, this will always be true
						OR: [
							{
								rosterAId: rosterId
							},
							{
								rosterBId: rosterId
							}
						]
					}
				],
				played,
				groupId,
				...(divisionId && {
					group: {
						divisionId
					}
				})
			},
			columns: fullMatchColumns,
			with: {
				rosterA: matchRosterQuery,
				rosterB: matchRosterQuery,
				group: nestedGroupQuery,
				bracket: {
					columns: {
						id: true,
						name: true
					},
					with: {
						division: nestedDivisionQuery
					}
				}
			}
		});

		const hasNextPage = results.length > PAGE_SIZE;
		const shownResults = results.slice(0, PAGE_SIZE);

		return { matches: shownResults, hasNextPage };
	}
);
