import { command } from '$app/server';
import { matchSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { MatchType } from '$lib/types';
import { and, eq } from 'drizzle-orm';
import * as z from 'zod';

export const updateGroupMatches = command(
	z.object({
		groupId: z.uuidv4(),
		matches: z.array(matchSchema)
	}),
	async ({ groupId, matches }) => {
		await db.transaction(async (tx) => {
			await tx
				.delete(schema.match)
				.where(and(eq(schema.match.groupId, groupId), eq(schema.match.type, MatchType.GROUP)));

			const inserts = matches.map((match) => ({ ...match, groupId }));
			await tx.insert(schema.match).values(inserts);
		});
	}
);
