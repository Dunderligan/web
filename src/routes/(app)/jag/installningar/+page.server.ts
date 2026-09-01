import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw error(401);
	}

	const apiKeysQuery = db.query.apiKey.findMany({
		where: {
			userId: locals.user.id
		},
		columns: {
			tokenHash: false
		}
	});

	const submissionsQuery = db.query.teamSubmission.findMany({
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

	const [apiKeys, submissions] = await Promise.all([apiKeysQuery, submissionsQuery]);

	return {
		apiKeys,
		submissions
	};
};
