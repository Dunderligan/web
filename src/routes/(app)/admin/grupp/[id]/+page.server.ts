import { db } from '#lib/server/db.ts';
import {
	entityQuery,
	fullMatchColumns,
	groupMatchOrder as groupMatchOrder,
	retrievePlayerCheckins
} from '#lib/server/db/helpers.ts';
import type { PlayerCheckin } from '#lib/types.ts';
import { flattenGroup } from '#lib/util.ts';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const group = await db.query.group.findFirst({
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

	if (!group) {
		error(404);
	}

	const { season } = flattenGroup(group);

	let checkins = new Map<string, PlayerCheckin>();
	if (season.checkinOpen) {
		const allPlayerIds = group.rosters.flatMap((roster) =>
			roster.members.map((member) => member.player.id)
		);

		checkins = await retrievePlayerCheckins(season.id, allPlayerIds);
	}

	return {
		group,
		checkins
	};
};
