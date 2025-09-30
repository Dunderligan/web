import { db, schema } from '$lib/server/db';

export const load = async () => {
	const data = await db.query.season.findMany({
		orderBy: schema.season.name
	});

	return { seasons: data };
};
