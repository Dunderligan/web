import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.division.findFirst({
		where: {
			id: params.id
		},
		with: {
			groups: {
				orderBy: { name: 'asc' },
				columns: {
					createdAt: false,
					divisionId: false
				}
			},
			season: {},
			brackets: {}
		}
	});

	if (!data) {
		error(404);
	}

	return { division: data };
};
