import { db } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw error(401);
	}

	const keys = await db.query.apiKey.findMany({
		where: {
			userId: locals.user.id
		}
	});

	return { keys };
};
