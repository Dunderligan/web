import { AuthRole, hasPermission } from '$lib/authRole.js';
import { db } from '$lib/server/db';
import { error } from 'console';

export const load = async ({ locals }) => {
	if (!hasPermission(locals.user?.role, AuthRole.ADMIN)) {
		throw error(403);
	}

	const users = await db.query.user.findMany({
		orderBy: {
			battletag: 'asc'
		}
	});

	return { users };
};
