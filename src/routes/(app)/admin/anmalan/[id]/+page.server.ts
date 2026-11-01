import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const registration = await db.query.registration.findFirst({
		where: { id: params.id },
		with: {
			season: true,
			submissions: {
				columns: {
					data: false
				}
			}
		}
	});

	if (!registration) {
		throw error(404, 'Registration not found');
	}

	return {
		registration
	};
};
