import { db, schema } from '$lib/server/db';
import { matchOrdering } from '$lib/server/db/helpers.js';
import { calculateStandings } from '$lib/table';
import { aggregateGroups } from '$lib/util';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: eq(schema.season.slug, params.season),
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
							played: true,
							vodUrl: true,
							playedAt: true,
							scheduledAt: true
						}
					},
					groups: {
						orderBy: schema.group.name,
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
								orderBy: matchOrdering,
								columns: {
									id: true,
									teamAScore: true,
									teamBScore: true,
									draws: true,
									rosterAId: true,
									rosterBId: true,
									played: true,
									vodUrl: true,
									playedAt: true,
									scheduledAt: true
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
			const { rosters, matches: groupMatches } = aggregateGroups(groups);
			const table = calculateStandings(rosters, groupMatches);

			const latestMatches = groupMatches.filter((match) => match.played).slice(0, 100);
			const upcomingMatches = groupMatches.filter((match) => !match.played).slice(0, 100);

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
