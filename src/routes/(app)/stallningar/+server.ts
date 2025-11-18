import { db, schema } from '$lib/server/db';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const latestSeason = await db.query.season.findFirst({
		orderBy: desc(schema.season.startedAt),
		columns: {
			slug: true
		}
	});

	if (!latestSeason) {
		error(404);
	}

	redirect(303, `/sasong/${latestSeason.slug}`);
};
