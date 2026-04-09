import { db } from '$lib/server/db';
import { entityQuery, memberQuery, nestedGroupQuery } from '$lib/server/db/helpers';
import overwatch from '$lib/server/overwatch';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const battletag = params.battletag.replace('-', '#');

	const player = await db.query.player.findFirst({
		where: {
			battletag
		},
		columns: {
			id: true,
			battletag: true,
			description: true,
			pronouns: true,
			overwatchProfileSlug: true
		},
		with: {
			socials: {
				columns: {
					platform: true,
					url: true
				}
			},
			memberships: {
				columns: memberQuery.columns,
				with: {
					roster: {
						...entityQuery,
						with: {
							group: nestedGroupQuery
						}
					}
				}
			},
			signatureHeroes: {
				columns: {},
				with: {
					hero: {
						columns: {
							name: true
						}
					}
				}
			},
			aliases: {
				columns: {
					name: true
				}
			}
		}
	});

	if (!player) {
		throw error(404);
	}

	const profile = await overwatch.getProfile(battletag, player.overwatchProfileSlug);

	return {
		player,
		profile
	};
};
