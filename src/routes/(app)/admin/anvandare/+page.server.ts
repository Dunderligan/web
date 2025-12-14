import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user?.isSuperAdmin) {
		error(403);
	}

	const users = await db.query.user.findMany({
		orderBy: {
			battletag: 'asc'
		}
	});

	return { users };
};
