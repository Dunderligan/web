import { db } from '$lib/server/db';
import { nestedGroupQuery, rolesOrder } from '$lib/server/db/helpers';
import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const load = async ({ params, locals }) => {
	const data = await db.query.roster.findFirst({
		where: {
			id: params.id
		},
		with: {
			members: {
				orderBy: (t) => sql`${rolesOrder(t.role)}, ${t.playerId} ASC`,
				columns: {
					isCaptain: true,
					tier: true,
					rank: true,
					role: true,
					sr: true
				},
				with: {
					player: {
						columns: {
							id: true,
							battletag: true
						}
					}
				}
			},
			team: {
				columns: {
					id: true
				},
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
							name: true,
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

	const currentRosterInfo = data.team.rosters.find((roster) => roster.id === data.id)!;
	const { team, ...roster } = { ...data, ...currentRosterInfo };

	return { roster, team };
};
