import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import * as z from 'zod';

export const createSeason = command(
	z.object({
		name: z.string(),
		startedAt: z.date()
	}),
	async ({ name, startedAt }) => {
		const slug = toSlug(name);

		const [season] = await db
			.insert(schema.season)
			.values({
				name,
				slug,
				startedAt
			})
			.returning();

		return { season };
	}
);
