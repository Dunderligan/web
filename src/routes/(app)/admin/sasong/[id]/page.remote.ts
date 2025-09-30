import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

export const createDivision = command(
	z.object({
		name: z.string(),
		seasonId: z.uuidv4()
	}),
	async ({ name, seasonId }) => {
		const slug = toSlug(name.split(' ').at(-1) ?? name);

		const [division] = await db
			.insert(schema.division)
			.values({
				name,
				seasonId,
				slug
			})
			.returning();

		return { division };
	}
);

export const deleteSeason = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await db.delete(schema.season).where(eq(schema.season.id, id));
	}
);
