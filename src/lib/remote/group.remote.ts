import { command } from '$app/server';
import { matchSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { and, eq } from 'drizzle-orm';
import * as z from 'zod';
import { adminGuard } from './auth.remote';

export const createGroup = command(
	z.object({
		name: z.string(),
		divisionId: z.uuidv4()
	}),
	async ({ name, divisionId }) => {
		await adminGuard();

		const slug = toSlug(name.split(' ').at(-1) ?? name);

		const [group] = await db
			.insert(schema.group)
			.values({
				name,
				divisionId,
				slug
			})
			.returning();

		return { group };
	}
);

export const updateGroup = command(
	z.object({
		id: z.uuid(),
		name: z.string().nonempty(),
		matches: z.array(matchSchema)
	}),
	async ({ id, name, matches }) => {
		await adminGuard();

		await db.transaction(async (tx) => {
			const slug = toSlug(name.split(' ').at(-1) ?? name);

			await tx
				.update(schema.group)
				.set({
					name,
					slug
				})
				.where(eq(schema.group.id, id));

			// delete all matches and recreate them
			await tx.delete(schema.match).where(and(eq(schema.match.groupId, id)));

			const inserts = matches.map((match) => ({ ...match, groupId: id }));

			if (inserts.length > 0) {
				await tx.insert(schema.match).values(inserts);
			}
		});
	}
);

export const deleteGroup = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.group).where(eq(schema.group.id, id));
	}
);
