import { AuthRole } from '$lib/authRole.js';
import { roleGuard } from '$lib/remote/auth.remote.js';
import { db, schema } from '$lib/server/db.js';
import { json } from '@sveltejs/kit';
import z from 'zod';

const matchSchema = z.object({
	rosterAId: z.uuid(),
	rosterBId: z.uuid(),
	scheduledAt: z.date().nullish(),
	groupId: z.uuid()
});

export const POST = async ({ request }) => {
	await roleGuard(AuthRole.ADMIN);

	const body = await request.json();
	const parsedBody = matchSchema.parse(body);

	const [match] = await db.insert(schema.match).values(parsedBody).returning();

	return json(match);
};
