import { db } from '$lib/server/db.js';
import { entityQuery } from '$lib/server/db/helpers.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const registration = await db.query.registration.findFirst({
		where: {
			season: {
				slug: params.season
			}
		},
		columns: {
			id: true,
			openDate: true,
			closeDate: true
		},
		with: {
			season: {
				columns: {
					legacyRanks: true,
					...entityQuery.columns
				}
			}
		}
	});

	if (!registration) {
		error(404);
	}

	return {
		registration
	};
};
