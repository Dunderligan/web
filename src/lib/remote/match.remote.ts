import { getRequestEvent, query } from '$app/server';
import { matchQueryParamsSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';
import { hiddenMatchFilter } from '$lib/server/db/hidden';

export const queryMatches = query(
	matchQueryParamsSchema,
	async ({ rosterId, divisionId, seasonId, state, isBracket, includeEmpty, page, pageSize }) => {
		const { locals } = getRequestEvent();

		const results = await db.query.match.findMany({
			// retrieve one extra to determine if there should be a next page
			limit: pageSize ? pageSize + 1 : undefined,
			offset: pageSize ? page * pageSize : undefined,
			...fullMatchQueryWithContext,
			where: {
				AND: [
					// if includeEmpty is false, filter out matches that have no rosters assigned to them
					...(!includeEmpty
						? [
								{
									OR: [
										{
											rosterAId: {
												isNotNull: true as true
											}
										},
										{
											rosterBId: {
												isNotNull: true as true
											}
										}
									]
								}
							]
						: []),
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
			}
		});

		const hasNextPage = pageSize ? results.length > pageSize : false;
		const shownResults = results.slice(0, pageSize);

		return { results: shownResults, hasNextPage };
	}
);
