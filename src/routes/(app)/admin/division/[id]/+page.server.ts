import { db } from '$lib/server/db';
import { divisionOrder } from '$lib/server/db/helpers';
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
			brackets: {
				orderBy: (t) => divisionOrder(t.name)
			}
		}
	});

	if (!data) {
		error(404);
	}

	return { division: data };
};
