import { AuthRole } from '$lib/authRole.js';
import { roleGuard } from '$lib/remote/auth.remote.js';
import { db } from '$lib/server/db';
import { matchRosterQuery, memberQueryWithoutPlayer } from '$lib/server/db/helpers.js';
import { error, json } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	await roleGuard(AuthRole.ADMIN);

	const { season: seasonId, discordId } = params;

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
							roster: {
								group: {
									division: {
										season: {
											id: seasonId
										}
									}
								}
							}
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
