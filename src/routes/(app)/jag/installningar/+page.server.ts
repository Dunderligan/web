import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw error(401);
	}

	const apiKeys = await db.query.apiKey.findMany({
		where: {
			userId: locals.user.id
		},
		columns: {
			tokenHash: false
		}
	});

	return {
		apiKeys
	};
};
