import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

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
							id: true,
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
							id: true,
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
							group: {
								columns: {
									name: true,
									slug: true
								},
								with: {
									division: {
										columns: {
											name: true,
											slug: true
										},
										with: {
											season: {
												columns: {
													name: true,
													slug: true
												}
											}
										}
									}
								}
							}
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
	const roster = { ...data, team: undefined, ...currentRosterInfo };

	return { roster, team: data.team };
};
