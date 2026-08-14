import { AuthRole } from '$lib/authRole.js';
import { roleGuard } from '$lib/remote/auth.remote.js';
import { db, schema } from '$lib/server/db';
import {
	matchRosterQuery,
	memberQueryWithoutPlayer,
	rosterSeasonFilter
} from '$lib/server/db/helpers.js';
import { error, json, redirect } from '@sveltejs/kit';
import z from 'zod';

export const GET = async ({ params }) => {
	await roleGuard(AuthRole.ADMIN);

	const { seasonId, discordId } = params;

	const checkin = await db.query.playerCheckin.findFirst({
		where: {
			discordId,
			seasonId
		},
		columns: {
			discordId: true,
			checkedInAt: true
		},
		with: {
			player: {
				columns: {
					id: true,
					battletag: true
				},
				with: {
					memberships: {
						...memberQueryWithoutPlayer,
						with: {
							roster: matchRosterQuery
						},
						where: {
							roster: rosterSeasonFilter(seasonId)
						}
					}
				}
			}
		}
	});

	if (!checkin) {
		error(404, 'Player either does not exist or has not checked in for this season');
	}

	return json(checkin);
};

const checkinSchema = z.object({
	battletag: z.string()
});

export const POST = async ({ params, request }) => {
	await roleGuard(AuthRole.ADMIN);

	const body = checkinSchema.safeParse(await request.json());
	if (!body.success) {
		error(400);
	}

	const [player, ...rest] = await db.query.player.findMany({
		where: {
			battletag: {
				ilike: body.data.battletag
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
			seasonId: params.seasonId,
			discordId: params.discordId
		})
		.onConflictDoNothing()
		.returning();

	if (!checkin) {
		// player was already checked in, return 409 Conflict
		error(409, 'Player already checked in');
	}

	return redirect(303, `/api/checkin/${params.seasonId}/${params.discordId}`);
};
