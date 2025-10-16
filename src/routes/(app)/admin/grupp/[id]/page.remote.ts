import { command, query } from '$app/server';
import { matchSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { and, eq } from 'drizzle-orm';
import * as z from 'zod';

export const updateGroup = command(
	z.object({
		id: z.uuid(),
		name: z.string().nonempty(),
		matches: z.array(matchSchema)
	}),
	async ({ id, name, matches }) => {
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
			await tx.insert(schema.match).values(inserts);
		});
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

export const getTeams = query(async () => {
	const teams = await db.query.team.findMany({
		columns: {
			id: true
		},
		with: {
			rosters: {
				limit: 1,
				columns: {
					id: true,
					name: true
				}
			}
		}
	});

	return teams;
});
