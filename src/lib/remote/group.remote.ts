import { command } from '$app/server';
import { matchSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import type { Transaction } from '$lib/server/db/helpers';

export const createGroup = command(
	z.object({
		name: z.string(),
		divisionId: z.uuidv4()
	}),
	async ({ name, divisionId }) => {
		await roleGuard(AuthRole.ADMIN);

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
		await roleGuard(AuthRole.MODERATOR);

		await db.transaction(async (tx) => {
			const slug = toSlug(name.split(' ').at(-1) ?? name);

			await tx
				.update(schema.group)
				.set({
					name,
					slug
				})
				.where(eq(schema.group.id, id));

			await updateMatches(tx, id, matches);
		});
	}
);

export const deleteGroup = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.delete(schema.group).where(eq(schema.group.id, id));
	}
);

async function updateMatches(
	tx: Transaction,
	groupId: string,
	newMatches: z.infer<typeof matchSchema>[]
) {
	const existing = await tx.query.match.findMany({
		where: {
			groupId
		},
		columns: {
			id: true
		}
	});

	const existingIds = new Set(existing.map((match) => match.id));
	const newMatchesById = new Map(newMatches.map((match) => [match.id, match]));

	for (const match of newMatches) {
		if (existingIds.has(match.id)) {
			await tx.update(schema.match).set(match).where(eq(schema.match.id, match.id));
		} else {
			await tx.insert(schema.match).values({
				...match,
				groupId
			});
		}
	}

	for (const match of existing) {
		if (!newMatchesById.has(match.id)) {
			await tx.delete(schema.match).where(eq(schema.match.id, match.id));
		}
	}
}
