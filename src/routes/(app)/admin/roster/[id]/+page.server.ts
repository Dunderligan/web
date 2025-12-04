import { db, schema } from '$lib/server/db';
import { nestedGroupQuery } from '$lib/server/db/helpers';
import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.roster.findFirst({
		where: and(eq(schema.roster.id, params.id)),
		with: {
			members: {
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
