import {
	groupMatchOrder,
	entityQuery,
	matchRosterQuery,
	nestedBracketQuery,
	nestedDivisionQuery,
	nestedGroupQuery,
	rolesOrder
} from '$lib/server/db/helpers';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const load = async ({ params }) => {
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
				orderBy: (t) => sql`${rolesOrder(t.role)}, ${schema.player.battletag} ASC`,
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
		orderBy: groupMatchOrder,
		columns: {
			id: true,
			teamAScore: true,
			teamBScore: true,
			draws: true,
			teamANote: true,
			teamBNote: true,
			playedAt: true,
			scheduledAt: true,
			played: true,
			vodUrl: true
		},
		with: {
			rosterA: matchRosterQuery,
			rosterB: matchRosterQuery,
			group: nestedGroupQuery,
			bracket: nestedBracketQuery
		}
	});

	const currentRosterInfo = data.team.rosters.find((r) => r.id === data.id)!;
	const roster = { ...data, team: undefined, ...currentRosterInfo, matches };

	return { roster, team: data.team };
};
