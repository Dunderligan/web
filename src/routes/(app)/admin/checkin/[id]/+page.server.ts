import { db } from '$lib/server/db.js';
import { entityQuery, retrievePlayerCheckins, rosterSeasonFilter } from '$lib/server/db/helpers.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const rosterQuery = db.query.roster.findMany({
		where: rosterSeasonFilter(params.id),
		columns: entityQuery.columns,
		with: {
			members: {
				columns: {},
				with: {
					player: {
						columns: {
							id: true
						}
					}
				}
			}
		}
	});

	const seasonQuery = db.query.season.findFirst({
		where: {
			id: params.id
		}
	});

	const [rosters, season] = await Promise.all([rosterQuery, seasonQuery]);

	if (!season) {
		throw error(404, 'Season not found');
	}

	const playerIds = rosters.flatMap((roster) => roster.members.map((member) => member.player.id));
	const checkins = await retrievePlayerCheckins(season.id, playerIds);

	return {
		rosters,
		season,
		totalPlayerCount: playerIds.length,
		checkins
	};
};
