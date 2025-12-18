import { db } from '$lib/server/db';
import { fullMatchColumns, groupMatchOrder } from '$lib/server/db/helpers';
import { calculateStandings } from '$lib/table';
import type { LogicalMatch } from '$lib/types.js';
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
			const { rosters, matches: combinedGroupMatches } = aggregateGroups(groups);
			let tables;
			if (division.groupwiseStandings) {
				tables = groups.map((group) =>
					makeTable(group.name, group.id, group.rosters, group.matches, 'grupp')
				);
			} else {
				tables = [makeTable(division.name, division.id, rosters, combinedGroupMatches, 'division')];
			}

			const latestMatches = combinedGroupMatches.filter((match) => match.played).slice(0, 3);
			const upcomingMatches = combinedGroupMatches.filter((match) => !match.played).slice(0, 3);

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
