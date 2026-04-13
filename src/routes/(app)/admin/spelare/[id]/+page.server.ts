import { canEditUserPage, isModerator } from '$lib/authRole.js';
import { db } from '$lib/server/db';
import overwatch from '$lib/server/overwatch.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals, depends }) => {
	depends('admin:player');

	const [player, heroes] = await Promise.all([
		getPlayer(params.id),
		db.query.hero.findMany({ orderBy: { name: 'asc' } })
	]);

	if (!player) {
		throw error(404);
	}

	if (!canEditUserPage(locals.user, player.battletag)) {
		throw error(403);
	}

	const [matchingProfiles, profile] = await Promise.all([
		getMatchingProfiles(player.aliases.map((alias) => alias.name)),
		overwatch.getProfile(player.battletag, player.overwatchProfileSlug)
	]);

	return {
		player,
		heroes,
		profile,
		matchingProfiles
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

async function getMatchingProfiles(aliases: string[]) {
	return await db.query.player.findMany({
		where: {
			battletag: {
				in: aliases
			}
		},
		columns: {
			id: true,
			battletag: true
		},
		with: {
			memberships: {}
		}
	});
}
