import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

export const editGroup = command(
	z.object({
		id: z.uuid(),
		name: z.string().nonempty()
	}),
	async ({ id, name }) => {
		const slug = toSlug(name);

		await db
			.update(schema.group)
			.set({
				name,
				slug
			})
			.where(eq(schema.group.id, id));
	}
);

export const createAndAddRoster = command(
	z.object({
		groupId: z.uuid(),
		seasonSlug: z.string(),
		name: z.string().nonempty()
	}),
	async ({ groupId, seasonSlug, name }) => {
		const [team] = await db.insert(schema.team).values({}).returning();

		const slug = toSlug(name);

		const [roster] = await db
			.insert(schema.roster)
			.values({
				name,
				slug,
				groupId,
				seasonSlug,
				teamId: team.id
			})
			.returning({ id: schema.roster.id });

		return { roster };
	}
);

export const deleteGroup = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await db.delete(schema.group).where(eq(schema.group.id, id));
	}
);
