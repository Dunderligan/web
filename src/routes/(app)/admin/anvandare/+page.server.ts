import { db } from '$lib/server/db';

export const load = async () => {
	const users = await db.query.user.findMany({
		orderBy: {
			battletag: 'asc'
		}
	});

	return { users };
};
