import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: eq(schema.season.id, params.id),
		columns: {
			createdAt: false
		},
		with: {
			divisions: {
				orderBy: schema.division.name,
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
