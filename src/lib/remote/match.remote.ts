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
	async ({ rosterId, seasonId, divisionId, groupId, played, page }) => {
		console.log(rosterId);
		const results = await db.query.match.findMany({
			limit: PAGE_SIZE,
			offset: page * PAGE_SIZE,
			orderBy: groupMatchOrder,
			where: {
				AND: [
					{
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
				groupId,
				// group: {
				// 	divisionId,
				// 	division: {
				// 		seasonId
				// 	}
				// },
				played
			},
			columns: fullMatchColumns,
			with: {
				rosterA: matchRosterQuery,
				rosterB: matchRosterQuery,
				group: nestedGroupQuery,
				division: nestedDivisionQuery
			}
		});

		return { matches: results };
	}
);
