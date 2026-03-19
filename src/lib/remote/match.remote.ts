import { getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import {
	entityQuery,
	fullMatchColumns,
	groupMatchOrder,
	hiddenMatchFilter,
	matchRosterQuery,
	nestedBracketQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';
import { MatchState } from '$lib/types';
import z from 'zod';

const PAGE_SIZE = 10;

export const queryMatches = query(
	z.object({
		rosterId: z.uuid().optional(),
		divisionId: z.uuid().optional(),
		page: z.number().min(0).default(0),
		state: z.array(z.enum(MatchState)).optional()
	}),
	async ({ rosterId, divisionId, state, page }) => {
		const { locals } = getRequestEvent();

		const results = await db.query.match.findMany({
			// retrieve one extra to determine if there should be a next page
			limit: PAGE_SIZE + 1,
			offset: page * PAGE_SIZE,
			orderBy: groupMatchOrder,
			where: {
				AND: [
					{
						// don't include matches without any roster assigned
						OR: [
							{
								rosterAId: {
									isNotNull: true
								}
							},
							{
								rosterBId: {
									isNotNull: true
								}
							}
						]
					},
					{
						// check if our target roster is involved in the match
						// if rosterId is undefined, this will always be true
						OR: [
							{
								rosterAId: rosterId
							},
							{
								rosterBId: rosterId
							}
						]
					},
					hiddenMatchFilter(locals.user)
				],
				// if divisionId is not provided, don't include the "group" filter property at all,
				// otherwise bracket matches would always be excluded (since they don't have a group)
				...(divisionId && {
					group: {
						divisionId
					}
				}),
				...(state && {
					state: {
						in: state
					}
				})
			},
			columns: fullMatchColumns,
			with: {
				rosterA: matchRosterQuery,
				rosterB: matchRosterQuery,
				group: nestedGroupQuery,
				bracket: nestedBracketQuery
			}
		});

		const hasNextPage = results.length > PAGE_SIZE;
		const shownResults = results.slice(0, PAGE_SIZE);

		return { results: shownResults, hasNextPage };
	}
);
