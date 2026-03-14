import { db } from '$lib/server/db';
import { entityQuery } from '$lib/server/db/helpers';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const division = await db.query.division.findFirst({
		...entityQuery,
		where: {
			id: params.id
		},
		with: {
			groups: {
				...entityQuery,
				with: {
					rosters: entityQuery
				}
			},
			brackets: {
				columns: {
					id: true,
					name: true
				}
			},
			season: entityQuery
		}
	});

	return json(division);
};
