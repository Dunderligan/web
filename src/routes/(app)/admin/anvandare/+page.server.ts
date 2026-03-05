import { AuthRole, checkPermission } from '$lib/authRole.js';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const load = async ({ locals }) => {
	// only admins should be able to see the user list
	if (!checkPermission(locals.user?.role, AuthRole.ADMIN)) {
		throw error(403);
	}

	const users = await db.query.user.findMany({
		orderBy: (table) => sql`lower(${table.battletag}) ASC`
	});

	return { users };
};
