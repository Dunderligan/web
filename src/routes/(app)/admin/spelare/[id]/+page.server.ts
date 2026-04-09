import { canEditUserPage, isModerator } from '$lib/authRole.js';
import { db } from '$lib/server/db';
import overwatch from '$lib/server/overwatch.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals, depends }) => {
	depends('admin:profile');

	const [player, heroes] = await Promise.all([getPlayer(params.id), db.query.hero.findMany()]);

	if (!player) {
		throw error(404);
	}

	if (!canEditUserPage(locals.user, player.battletag)) {
		throw error(403);
	}

	const profile = await overwatch.getProfile(player.battletag, player.overwatchProfileSlug);

	return {
		player,
		heroes,
		profile
	};
};

async function getPlayer(id: string) {
	return await db.query.player.findFirst({
		where: { id },
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
}
