import { isModerator } from '$lib/authRole.js';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const player = await db.query.player.findFirst({
		where: {
			id: params.id
		},
		with: {
			socials: {
				columns: {
					platform: true,
					url: true
				}
			},
			signatureHeroes: {
				columns: {},
				with: {
					hero: {}
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
		error(404);
	}

	const isOwnProfile = locals.user?.battletag == player.battletag;

	if (!isOwnProfile && !isModerator(locals.user?.role)) {
		error(403);
	}

	const heroes = await db.query.hero.findMany();

	return {
		player,
		heroes
	};
};
