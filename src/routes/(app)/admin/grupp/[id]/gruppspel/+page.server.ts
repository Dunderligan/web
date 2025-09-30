import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.group.findFirst({
		where: eq(schema.group.id, params.id),
		columns: {},
		with: {
			matches: {}
		}
	});

	if (!data) {
		error(404);
	}

	return { matches: data.matches };
};
