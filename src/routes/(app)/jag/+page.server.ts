import { db } from '$lib/server/db.js';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const battletag = locals.user?.battletag;

	if (!battletag) {
		throw error(401);
	}

	// look for an exact match first
	let player = await db.query.player.findFirst({
		where: { battletag },
		columns: { battletag: true }
	});

	if (!player) {
		// if not found, look for a player with the same name but different/missing discriminator
		const name = battletag.split('#')[0];

		player = await db.query.player.findFirst({
			where: { battletag: { like: `${name}%` } },
			columns: { battletag: true }
		});
	}

	if (player) {
		const slug = player.battletag.replace('#', '-');
		return redirect(302, `/spelare/${slug}`);
	}

	// else show the /jag page, informing the user their profile does not exist
};
