import { db } from '$lib/server/db';
import { hiddenSeasonFilter } from '$lib/server/db/hidden.js';

export const load = async ({ locals }) => {
	const seasons = await db.query.season.findMany({
		orderBy: {
			startedAt: 'asc'
		},
		where: {
			hidden: hiddenSeasonFilter(locals.user)
		},
		columns: {
			id: true,
			name: true,
			slug: true,
			startedAt: true,
			spinoff: true
		}
	});

	return { seasons };
};
