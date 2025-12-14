import { db, schema } from '$lib/server/db';
import { fullMatchColumns, groupMatchOrder } from '$lib/server/db/helpers.js';
import { calculateStandings } from '$lib/table';
import { aggregateGroups } from '$lib/util';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: {
			slug: params.season
		},
		columns: {
			name: true,
			slug: true,
			startedAt: true,
			endedAt: true
		},
		with: {
			divisions: {
				orderBy: {
					name: 'asc'
				},
				columns: {
					id: true,
					name: true,
					slug: true,
					playoffLine: true
				},
				with: {
					matches: {
						orderBy: {
							order: 'asc'
						},
						columns: fullMatchColumns
					},
					groups: {
						orderBy: {
							name: 'asc'
						},
						columns: {
							id: true,
							name: true,
							slug: true
						},
						with: {
							rosters: {
								columns: {
									id: true,
									name: true,
									slug: true
								}
							},
							matches: {
								orderBy: groupMatchOrder,
								columns: fullMatchColumns
							}
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	const { divisions, ...season } = data;

	return {
		season,
		divisions: divisions.map(({ groups, ...division }) => {
			const { rosters, matches: groupMatches } = aggregateGroups(groups);
			const table = calculateStandings(rosters, groupMatches);

			const latestMatches = groupMatches.filter((match) => match.played).slice(0, 3);
			const upcomingMatches = groupMatches.filter((match) => !match.played).slice(0, 3);

			return {
				rosters,
				table,
				latestMatches,
				upcomingMatches,
				...division
			};
		})
	};
};
