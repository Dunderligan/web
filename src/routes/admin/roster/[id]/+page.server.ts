import { db, schema } from '$lib/server/db';
import { nestedGroupQuery } from '$lib/server/db/helpers';
import type { FullRoster } from '$lib/types';
import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

export const load = async ({ params, locals }) => {
	const data = await db.query.roster.findFirst({
		where: and(eq(schema.roster.id, params.id)),
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
							...nestedGroupQuery
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	const currentRosterInfo = data.team.rosters.find((r) => r.id === data.id)!;
	const roster: FullRoster = { ...data, team: undefined, ...currentRosterInfo };

	return { roster, team: data.team };
};
