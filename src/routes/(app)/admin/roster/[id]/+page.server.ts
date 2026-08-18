import { db } from '$lib/server/db';
import {
	entityQuery,
	memberQuery,
	nestedGroupQuery,
	retrievePlayerCheckins
} from '$lib/server/db/helpers';
import type { PlayerCheckin } from '$lib/types';
import { flattenGroup } from '$lib/util';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.roster.findFirst({
		where: {
			id: params.id
		},
		with: {
			members: memberQuery,
			team: {
				with: {
					socials: true,
					rosters: {
						...entityQuery,
						with: {
							group: nestedGroupQuery
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	const currentRosterInfo = data.team.rosters.find((roster) => roster.id === data.id)!;
	const { team, ...roster } = { ...data, ...currentRosterInfo };

	const { season } = flattenGroup(roster.group);

	const checkins = season.checkinOpen
		? await retrievePlayerCheckins(
				season.id,
				roster.members.map((member) => member.player.id)
			)
		: new Map<string, PlayerCheckin>();

	return { roster, team, checkins };
};
