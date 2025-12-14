import { db } from '$lib/server/db';

export const load = async () => {
	const seasons = await db.query.season.findMany({
		orderBy: {
			startedAt: 'asc'
		},
		columns: {
			createdAt: false
		}
	});

	return { seasons };
};
