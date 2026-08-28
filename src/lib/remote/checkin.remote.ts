import { command } from '$app/server';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/authRole';
import { db, schema } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';

export const deleteCheckin = command(
	z.object({
		seasonId: z.uuid(),
		discordId: z.string()
	}),
	async ({ seasonId, discordId }) => {
		await roleGuard(AuthRole.ADMIN);

		await db
			.delete(schema.playerCheckin)
			.where(
				and(
					eq(schema.playerCheckin.seasonId, seasonId),
					eq(schema.playerCheckin.discordId, discordId)
				)
			);
	}
);
