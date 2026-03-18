import { AuthRole } from '$lib/authRole.js';
import { roleGuard } from '$lib/remote/auth.remote.js';
import { db, schema } from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';
import z from 'zod';

const matchSchema = z.object({
	rosterAId: z.uuid(),
	rosterBId: z.uuid(),
	scheduledAt: z.coerce.date().nullish(),
	groupId: z.uuid()
});

export const POST = async ({ request }) => {
	await roleGuard(AuthRole.ADMIN);

	const body = await request.json();
	const parsedBody = matchSchema.safeParse(body);
	if (!parsedBody.success) {
		throw error(400, 'Invalid request body');
	}

	const [match] = await db.insert(schema.match).values(parsedBody.data).returning();

	return json(match);
};
