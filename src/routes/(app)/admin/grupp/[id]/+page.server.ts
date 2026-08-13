import { db } from '$lib/server/db';
import {
	entityQuery,
	fullMatchColumns,
	groupMatchOrder as groupMatchOrder,
	retrievePlayerCheckins
} from '$lib/server/db/helpers';
import type { PlayerCheckin } from '$lib/types';
import { flattenGroup } from '$lib/util';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.group.findFirst({
		where: {
			id: params.id
		},
		with: {
			rosters: {
				orderBy: { name: 'asc' },
				columns: entityQuery.columns,
				// get the members so we can cross check it with the checkins list
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
			},
			matches: {
				orderBy: groupMatchOrder,
				columns: fullMatchColumns
			},
			division: {
				with: {
					season: true
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	const { season, division, group } = flattenGroup(data);

	let checkins = new Map<string, PlayerCheckin>();
	if (season.checkinOpen) {
		const allPlayerIds = group.rosters.flatMap((roster) =>
			roster.members.map((member) => member.player.id)
		);

		checkins = await retrievePlayerCheckins(season.id, allPlayerIds);
	}

	return {
		season,
		division,
		group,
		checkins
	};
};
