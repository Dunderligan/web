import { db } from '#lib/server/db.ts';
import { entityQuery } from '#lib/server/db/helpers.ts';
import { error } from '@sveltejs/kit';

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

	if (!division) {
		throw error(404);
	}

	return Response.json(division);
};
