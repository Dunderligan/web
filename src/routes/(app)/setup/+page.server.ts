import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const load = async () => {
	const user = await db.query.user.findFirst();

	if (user) {
		// already set up
		redirect(303, '/');
	}
};
