import { db } from '$lib/server/db';
import { leagueQuery } from '$lib/server/db/helpers.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.bracket.findFirst({
		where: {
			id: params.id
		},
		with: {
			division: {
				...leagueQuery,
				with: {
					season: leagueQuery,
					groups: {
						columns: {},
						with: {
							rosters: {
								columns: {
									id: true,
									name: true,
									slug: true
								}
							}
						}
					}
				}
			},
			matches: {
				orderBy: { order: 'asc' }
			}
		}
	});

	if (!data) {
		error(404);
	}

	const {
		division: { groups, ...division },
		...bracket
	} = data;
	const rosters = groups.flatMap((group) => group.rosters);

	return { division, bracket, rosters };
};
