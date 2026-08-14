import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'You need to be logged in to access this page');
	}

	const submissions = await db.query.teamSubmission.findMany({
		where: {
			submittedById: locals.user?.id
		},
		columns: {
			data: false
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		submissions
	};
};
