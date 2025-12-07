import { db, schema } from '$lib/server/db';

export const load = async () => {
	const data = await db.query.season.findMany({
		orderBy: {
			startedAt: 'desc'
		}
	});

	return { seasons: data };
};
