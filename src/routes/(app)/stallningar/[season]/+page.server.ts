import { compareMatchDates } from '$lib/match';
import { db } from '$lib/server/db';
import { fullMatchColumns, groupMatchOrder } from '$lib/server/db/helpers';
import { calculateStandings } from '$lib/table';
import type { LogicalMatch } from '$lib/types';
import { aggregateGroups } from '$lib/util';
import { error } from '@sveltejs/kit';

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
					playoffLine: true,
					groupwiseStandings: true
				},
				with: {
					brackets: {
						columns: {
							id: true,
							name: true
						},
						orderBy: {
							name: 'asc'
						},
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

			let tables;
			if (division.groupwiseStandings) {
				tables = groups.map((group) =>
					makeTable(group.name, group.id, group.rosters, group.matches, 'grupp')
				);
			} else {
				tables = [makeTable(division.name, division.id, rosters, divisionMatches, 'division')];
			}

			divisionMatches.sort((a, b) => compareMatchDates(a, b));
			const latestMatches = divisionMatches.filter((match) => match.played).slice(0, 3);
			const upcomingMatches = divisionMatches.filter((match) => !match.played).slice(0, 3);

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

function makeTable<R extends { id: string }>(
	title: string,
	id: string,
	rosters: R[],
	matches: LogicalMatch[],
	type: 'division' | 'grupp'
) {
	return {
		title,
		id,
		standings: calculateStandings(rosters, matches),
		type
	};
}
