import { db } from '#lib/server/db.ts';

export const load = async () => {
	const seasons = await db.query.season.findMany({
		orderBy: {
			startedAt: 'desc'
		}
	});

	return { seasons };
};
