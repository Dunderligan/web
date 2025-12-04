import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { adminGuard } from './auth.remote';

export const createSeason = command(
	z.object({
		name: z.string(),
		startedAt: z.date(),
		useSr: z.boolean()
	}),
	async ({ name, startedAt, useSr }) => {
		await adminGuard();

		const slug = toSlug(name);

		const [season] = await db
			.insert(schema.season)
			.values({
				name,
				slug,
				startedAt,
				useSr
			})
			.returning();

		return { season };
	}
);

export const updateSeason = command(
	z.object({
		id: z.uuid(),
		startedAt: z.date(),
		endedAt: z.date().nullish()
	}),
	async ({ id, startedAt, endedAt }) => {
		await adminGuard();

		await db.update(schema.season).set({ startedAt, endedAt }).where(eq(schema.season.id, id));
	}
);

export const deleteSeason = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.season).where(eq(schema.season.id, id));
	}
);
