import { getRequestEvent, query } from '$app/server';
import { matchQueryParamsSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { fullMatchQueryWithContext, isNull } from '$lib/server/db/helpers';
import { hiddenMatchFilter } from '$lib/server/db/hidden';
import { MatchState } from '$lib/types';

export const queryMatches = query(
	matchQueryParamsSchema,
	async ({
		rosterId,
		divisionId,
		seasonId,
		state,
		isBracket,
		hasDate,
		includeEmpty,
		page,
		pageSize
	}) => {
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
					// check match date filters
					// the date we want to check depends on the match state, so we need to check all three cases
					{
						OR: [
							{
								// if scheduled, check if it has a scheduled date
								state: MatchState.SCHEDULED,
								scheduledAt: isNull(hasDate === true ? false : undefined)
							},
							{
								// if played, check if it has a played date
								state: MatchState.PLAYED,
								playedAt: isNull(hasDate === true ? false : undefined)
							},
							{
								// otherwise, ignore the date and always include the match (however it can still be filtered out by the state filter below)
								state: {
									notIn: [MatchState.SCHEDULED, MatchState.PLAYED]
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
				bracketId: isNull(!isBracket),
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
