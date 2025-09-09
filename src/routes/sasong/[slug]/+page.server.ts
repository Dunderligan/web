import { db, schema } from '$lib/server/db/index.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const season = await db.query.season.findFirst({
		where: eq(schema.season.slug, params.slug),
		columns: {
			name: true,
			slug: true
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

	if (!season) {
		error(404);
	}

	type TableScore = {
		mapWins: number;
		mapLosses: number;
		mapDraws: number;
		matchesPlayed: number;
	};

	const tables = new Map(
		season.divisions.flatMap((div) =>
			div.groups.map((group) => {
				const rosterScores = new Map<string, TableScore>();

				for (const roster of group.rosters) {
					rosterScores.set(roster.id, { mapWins: 0, mapLosses: 0, mapDraws: 0, matchesPlayed: 0 });
				}

				for (const match of group.matches) {
					if (!match.rosterAId || !match.rosterBId) continue;

					const teamA = rosterScores.get(match.rosterAId);
					const teamB = rosterScores.get(match.rosterBId);

					if (!teamA || !teamB) {
						console.warn('Roster not found in group', match);
						continue;
					}

					teamA.mapWins += match.teamAScore;
					teamA.mapLosses += match.teamBScore;
					teamA.mapDraws += match.draws;

					teamB.mapWins += match.teamBScore;
					teamB.mapLosses += match.teamAScore;
					teamB.mapDraws += match.draws;

					teamA.matchesPlayed += 1;
					teamB.matchesPlayed += 1;
				}

				const sortedRosters = [...rosterScores]
					.map(([rosterId, score]) => ({
						rosterId,
						score
					}))
					.sort(
						(a, b) =>
							a.score.mapWins - b.score.mapWins || a.score.matchesPlayed - b.score.matchesPlayed
					)
					.reverse();

				return [group.id, sortedRosters];
			})
		)
	);

	return { season, tables };
};
