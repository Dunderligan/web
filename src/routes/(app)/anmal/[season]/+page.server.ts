import { db } from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const registration = await db.query.registration.findFirst({
		where: {
			season: {
				slug: params.season
			}
		},
		columns: {
			openDate: true,
			closeDate: true,
			url: true
		}
	});

	if (!registration) {
		error(404);
	}

	return {
		registration
	};
};
