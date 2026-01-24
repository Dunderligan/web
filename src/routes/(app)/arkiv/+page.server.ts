import { db } from '$lib/server/db';
import { hiddenSeasonFilter } from '$lib/server/db/helpers';

export const load = async ({ locals }) => {
	const seasons = await db.query.season.findMany({
		orderBy: {
			startedAt: 'asc'
		},
		where: {
			hidden: hiddenSeasonFilter(locals.user)
		},
		columns: {
			createdAt: false
		}
	});

	return { seasons };
};
