import {
	nestedGroupQuery,
	rolesOrder,
	fullMatchQueryWithContext,
	hiddenGroupFilter
} from '$lib/server/db/helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const load = async ({ params, locals }) => {
	const data = await db.query.roster.findFirst({
		where: {
			seasonSlug: params.season,
			slug: params.roster
		},
		columns: {
			id: true,
			name: true,
			slug: true,
			seasonSlug: true
		},
		with: {
			members: {
				orderBy: (t) => sql`${rolesOrder(t.role)}, ${t.playerId} ASC`,
				columns: {
					isCaptain: true,
					tier: true,
					rank: true,
					sr: true,
					role: true
				},
				with: {
					player: {
						columns: {
							battletag: true
						}
					}
				}
			},
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
							group: hiddenGroupFilter(locals.user)
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
			rosterAId: {
				isNotNull: true
			},
			rosterBId: {
				isNotNull: true
			},
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
