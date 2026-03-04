import { AuthRole, checkPermission } from '$lib/authRole.js';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// only admins should be able to see the user list
	if (!checkPermission(locals.user?.role, AuthRole.ADMIN)) {
		throw error(403);
	}

	const users = await db.query.user.findMany({
		orderBy: {
			battletag: 'asc'
		}
	});

	return { users };
};
