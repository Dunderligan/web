import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: {
			id: params.id
		},
		columns: {
			createdAt: false
		},
		with: {
			divisions: {
				orderBy: { name: 'asc' },
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
