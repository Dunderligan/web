import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.division.findFirst({
		where: eq(schema.division.id, params.id),
		columns: {
			createdAt: false
		},
		with: {
			groups: {
				columns: {
					createdAt: false,
					divisionId: false
				}
			},
			season: {
				columns: {
					createdAt: false
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	return { division: data };
};
