import { matchOrdering, matchRosterQuery, nestedGroupQuery } from '$lib/server/db/helpers';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq, and, desc, or } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.roster.findFirst({
		where: and(eq(schema.roster.seasonSlug, params.season), eq(schema.roster.slug, params.roster)),
		columns: {
			id: true,
			name: true,
			slug: true,
			seasonSlug: true
		},
		with: {
			members: {
				columns: {
					isCaptain: true,
					tier: true,
					rank: true,
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
		where: and(or(eq(schema.match.rosterAId, data.id), eq(schema.match.rosterBId, data.id))),
		limit: 3,
		orderBy: matchOrdering,
		columns: {
			id: true,
			teamAScore: true,
			teamBScore: true,
			draws: true,
			playedAt: true,
			scheduledAt: true,
			played: true,
			vodUrl: true
		},
		with: {
			rosterA: matchRosterQuery,
			rosterB: matchRosterQuery
		}
	});

	const currentRosterInfo = data.team.rosters.find((r) => r.id === data.id)!;
	const roster = { ...data, team: undefined, ...currentRosterInfo, matches };

	return { roster, team: data.team };
};
