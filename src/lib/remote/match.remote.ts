import { getRequestEvent, query } from '$app/server';
import { matchQueryParamsSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import {
	fullMatchColumns,
	groupMatchOrder,
	hiddenMatchFilter,
	matchRosterQuery,
	nestedBracketQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';

export const queryMatches = query(
	matchQueryParamsSchema,
	async ({ rosterId, divisionId, seasonId, state, isBracket, page, pageSize }) => {
		const { locals } = getRequestEvent();

		const results = await db.query.match.findMany({
			// retrieve one extra to determine if there should be a next page
			limit: pageSize ? pageSize + 1 : undefined,
			offset: pageSize ? page * pageSize : undefined,
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
				// check target division and season
				// matches either have a group or a bracket, so we need to check both
				OR: [
					{
						group: {
							division: {
								id: divisionId,
								season: {
									id: seasonId
								}
							}
						}
					},
					{
						bracket: {
							division: {
								id: divisionId,
								season: {
									id: seasonId
								}
							}
						}
					}
				],
				// drizzle does not allow isNotNull: false or isNull: false, so we need to split them
				...(isBracket === true && {
					bracketId: {
						isNotNull: true
					}
				}),
				...(isBracket === false && {
					bracketId: {
						isNull: true
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

		const hasNextPage = pageSize ? results.length > pageSize : false;
		const shownResults = results.slice(0, pageSize);

		return { results: shownResults, hasNextPage };
	}
);
