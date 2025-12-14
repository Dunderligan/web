import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const load = async () => {
	const latestSeason = await db.query.season.findFirst({
		orderBy: {
			startedAt: 'desc'
		},
		columns: {
			slug: true
		}
	});

	if (!latestSeason) {
		error(404);
	}

	redirect(303, `/stallningar/${latestSeason.slug}`);
};
