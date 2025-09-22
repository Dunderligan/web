import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

export const createGroup = command(
	z.object({
		name: z.string(),
		divisionId: z.uuidv4()
	}),
	async ({ name, divisionId }) => {
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
