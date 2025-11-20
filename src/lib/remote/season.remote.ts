import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

export const createSeason = command(
	z.object({
		name: z.string(),
		startedAt: z.date()
	}),
	async ({ name, startedAt }) => {
		const slug = toSlug(name.split(' ').at(-1) ?? name);

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

export const editSeason = command(
	z.object({
		id: z.uuid(),
		startedAt: z.date(),
		endedAt: z.date().nullable().optional()
	}),
	async ({ id, startedAt, endedAt }) => {
		await db.update(schema.season).set({ startedAt, endedAt }).where(eq(schema.season.id, id));
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
