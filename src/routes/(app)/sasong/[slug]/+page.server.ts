import { db, schema } from '$lib/server/db/index.js';
import { aggregateGroups, calculateStandings } from '$lib/util.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: eq(schema.season.slug, params.slug),
		columns: {
			name: true,
			slug: true,
			startedAt: true,
			endedAt: true
		},
		with: {
			divisions: {
				orderBy: schema.division.name,
				columns: {
					id: true,
					name: true,
					slug: true
				},
				with: {
					matches: {
						orderBy: schema.match.order,
						columns: {
							id: true,
							teamAScore: true,
							teamBScore: true,
							draws: true,
							rosterAId: true,
							rosterBId: true,
							nextMatchId: true,
							played: true
						}
					},
					groups: {
						orderBy: schema.division.name,
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
								where: eq(schema.match.played, true),
								columns: {
									teamAScore: true,
									teamBScore: true,
									draws: true,
									rosterAId: true,
									rosterBId: true
								}
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
			const { rosters, matches } = aggregateGroups(groups);
			const table = calculateStandings(rosters, matches);

			return {
				rosters,
				table,
				...division
			};
		})
	};
};
