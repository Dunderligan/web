import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

export const deleteGroup = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await db.delete(schema.group).where(eq(schema.group.id, id));
	}
);
