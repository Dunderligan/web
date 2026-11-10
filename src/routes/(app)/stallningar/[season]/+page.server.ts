import { compareMatchDates } from '$lib/match';
import { db } from '$lib/server/db';
import { fullMatchColumns, divisionOrder, fullGroupQuery } from '$lib/server/db/helpers';
import { hiddenSeasonFilter } from '$lib/server/db/hidden.js';
import { generateDivisionStandings } from '$lib/server/standings';
import { MatchState } from '$lib/types';
import { aggregateGroups } from '$lib/util';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const data = await db.query.season.findFirst({
		where: {
			slug: params.season,
			hidden: hiddenSeasonFilter(locals.user)
		},
		with: {
			divisions: {
				orderBy: (t) => divisionOrder(t.name),
				columns: {
					seasonId: false
				},
				with: {
					brackets: {
						columns: {
							id: true,
							name: true,
							format: true
						},
						orderBy: (t) => divisionOrder(t.name),
						with: {
							matches: {
								orderBy: {
									order: 'asc'
								},
								columns: fullMatchColumns
							}
						}
					},
					groups: fullGroupQuery
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
		divisions: divisions.map((division) => {
			const { rosters, matches } = aggregateGroups(division.groups);

			const tables = generateDivisionStandings(division, { legacy: season.legacySeeding });

			matches.sort((a, b) => compareMatchDates(a, b));
			const latestMatches = matches
				.filter((match) => match.state === MatchState.PLAYED)
				.slice(0, 3);
			const upcomingMatches = matches
				.filter((match) => match.state === MatchState.SCHEDULED)
				.slice(0, 3);

			return {
				rosters,
				tables,
				latestMatches,
				upcomingMatches,
				...division
			};
		})
	};
};
