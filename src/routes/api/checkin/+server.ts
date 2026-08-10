import { AuthRole } from '$lib/authRole.js';
import { roleGuard } from '$lib/remote/auth.remote.js';
import { db, schema } from '$lib/server/db.js';
import { error, json, redirect } from '@sveltejs/kit';
import z from 'zod';

const checkinSchema = z.object({
	seasonId: z.uuid(),
	battletag: z.string(),
	discordId: z.string()
});

export const POST = async ({ request }) => {
	await roleGuard(AuthRole.ADMIN);

	const body = checkinSchema.safeParse(await request.json());
	if (!body.success) {
		error(400);
	}

	const { seasonId, battletag, discordId } = body.data;

	// find the playerId by battletag and seasonId
	const [player, ...rest] = await db.query.player.findMany({
		where: {
			battletag: {
				ilike: battletag
			}
		},
		columns: {
			id: true
		}
	});

	if (!player) {
		error(404, 'Player not found');
	}

	if (rest.length > 0) {
		error(400, 'Multiple matching players found');
	}

	const [checkin] = await db
		.insert(schema.playerCheckin)
		.values({
			playerId: player.id,
			seasonId,
			discordId
		})
		.onConflictDoNothing()
		.returning();

	if (!checkin) {
		// player was already checked in
		error(409, 'Player already checked in');
	}

	return redirect(303, `/api/checkin/${seasonId}/${discordId}`);
};
