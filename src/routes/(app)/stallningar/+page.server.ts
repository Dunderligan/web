import { db } from '$lib/server/db';
import { hiddenSeasonFilter } from '$lib/server/db/helpers.js';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const latestSeason = await db.query.season.findFirst({
		orderBy: {
			startedAt: 'desc'
		},
		where: {
			hidden: hiddenSeasonFilter(locals.user)
		},
		columns: {
			slug: true
		}
	});

	if (!latestSeason) {
		error(404);
	}

	redirect(302, `/stallningar/${latestSeason.slug}`);
};
