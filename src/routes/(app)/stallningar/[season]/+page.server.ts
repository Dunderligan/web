import { compareMatchDates } from '$lib/match';
import { db } from '$lib/server/db';
import {
	fullMatchColumns,
	groupMatchOrder,
	divisionOrder,
	hiddenSeasonFilter
} from '$lib/server/db/helpers';
import { calculateStandings } from '$lib/standings';
import { MatchState, type LogicalMatch } from '$lib/types';
import { aggregateGroups } from '$lib/util';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const data = await db.query.season.findFirst({
		where: {
			slug: params.season,
			hidden: hiddenSeasonFilter(locals.user)
		},
		columns: {
			name: true,
			slug: true,
			startedAt: true,
			endedAt: true,
			legacySeeding: true,
			spinoff: true
		},
		with: {
			divisions: {
				orderBy: (t) => divisionOrder(t.name),
				columns: {
					id: true,
					name: true,
					slug: true,
					playoffLine: true,
					groupwiseStandings: true
				},
				with: {
					brackets: {
						columns: {
							id: true,
							name: true
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
									slug: true,
									resigned: true
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
			const { rosters, matches: divisionMatches } = aggregateGroups(groups);

			let groupings;
			if (division.groupwiseStandings) {
				groupings = groups.map((group) => ({
					title: group.name,
					matches: group.matches,
					rosters: group.rosters,
					adminUrl: `/admin/grupp/${group.id}`
				}));
			} else {
				groupings = [
					{
						title: null,
						matches: divisionMatches,
						rosters,
						adminUrl: `/admin/division/${division.id}`
					}
				];
			}

			const tables = groupings.map(({ matches, rosters, ...table }) => {
				const standings = calculateStandings(rosters, matches, season.legacySeeding);

				return {
					...table,
					standings
				};
			});

			divisionMatches.sort((a, b) => compareMatchDates(a, b));
			const latestMatches = divisionMatches
				.filter((match) => match.state === MatchState.PLAYED)
				.slice(0, 3);
			const upcomingMatches = divisionMatches
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
