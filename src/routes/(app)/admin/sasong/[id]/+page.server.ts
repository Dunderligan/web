import { db } from '$lib/server/db';
import { divisionOrder } from '$lib/server/db/helpers';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: {
			id: params.id
		},
		with: {
			registration: true,
			divisions: {
				orderBy: (t) => divisionOrder(t.name),
				columns: {
					createdAt: false,
					seasonId: false
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	return { season: data };
};
