import { db } from '$lib/server/db';
import { hiddenSeasonFilter } from '$lib/server/db/hidden.js';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const latestSeason = await db.query.season.findFirst({
		orderBy: {
			startedAt: 'desc'
		},
		where: {
			hidden: hiddenSeasonFilter(locals.user),
			spinoff: false
		},
		columns: {
			slug: true
		}
	});

	if (!latestSeason) {
		throw error(404, 'No seasons found');
	}

	redirect(302, `/stallningar/${latestSeason.slug}`);
};
