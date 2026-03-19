import {
	groupMatchOrder,
	matchRosterQuery,
	nestedBracketQuery,
	nestedGroupQuery,
	hiddenSeasonFilter,
	memberQuery,
	fullMatchQueryWithContext
} from '$lib/server/db/helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const data = await db.query.roster.findFirst({
		where: {
			slug: params.roster,
			group: {
				division: {
					season: {
						slug: params.season
					}
				}
			}
		},
		columns: {
			id: true,
			name: true,
			slug: true
		},
		with: {
			members: memberQuery,
			team: {
				columns: {},
				with: {
					socials: {
						columns: {
							platform: true,
							url: true
						}
					},
					rosters: {
						columns: {
							id: true,
							slug: true
						},
						where: {
							group: {
								division: {
									season: {
										hidden: hiddenSeasonFilter(locals.user)
									}
								}
							}
						},
						with: {
							group: nestedGroupQuery
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	const matches = await db.query.match.findMany({
		where: {
			OR: [
				{
					rosterAId: data.id
				},
				{
					rosterBId: data.id
				}
			]
		},
		...fullMatchQueryWithContext
	});

	const currentRosterInfo = data.team.rosters.find((r) => r.id === data.id)!;

	if (!currentRosterInfo) {
		// our current roster is in a hidden season we can't access
		error(404);
	}

	const roster = { ...data, team: undefined, ...currentRosterInfo, matches };

	return { roster, team: data.team };
};
