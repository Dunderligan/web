import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { adminGuard } from './auth.remote';

export const createDivision = command(
	z.object({
		name: z.string(),
		seasonId: z.uuidv4()
	}),
	async ({ name, seasonId }) => {
		await adminGuard();

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

export const updateDivision = command(
	z.object({
		id: z.uuid(),
		name: z.string().nonempty(),
		playoffLine: z.number().nullable(),
		groupwiseStandings: z.boolean()
	}),
	async ({ id, name, playoffLine, groupwiseStandings }) => {
		await adminGuard();

		const slug = toSlug(name.split(' ').at(-1) ?? name);

		await db
			.update(schema.division)
			.set({ slug, name, playoffLine, groupwiseStandings })
			.where(eq(schema.division.id, id));
	}
);

export const deleteDivision = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.division).where(eq(schema.division.id, id));
	}
);
