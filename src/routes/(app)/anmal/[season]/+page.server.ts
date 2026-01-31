import { db } from '$lib/server/db.js';
import { hiddenSeasonFilter } from '$lib/server/db/helpers';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	const registration = await db.query.registration.findFirst({
		where: {
			season: {
				slug: params.season,
				hidden: hiddenSeasonFilter(locals.user)
			}
		},
		columns: {
			open: true,
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
