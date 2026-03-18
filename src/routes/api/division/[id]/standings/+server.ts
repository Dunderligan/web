import { db } from '$lib/server/db';
import { entityQuery, fullMatchColumns } from '$lib/server/db/helpers';
import { calculateStandings } from '$lib/table.js';
import { aggregateGroups } from '$lib/util';
import { json, error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const division = await db.query.division.findFirst({
		where: {
			id: params.id
		},
		columns: {
			name: true,
			groupwiseStandings: true
		},
		with: {
			groups: {
				columns: {
					name: true
				},
				with: {
					rosters: entityQuery,
					matches: {
						columns: fullMatchColumns
					}
				}
			}
		}
	});

	if (!division) {
		throw error(404);
	}

	let groupings;

	if (division?.groupwiseStandings) {
		groupings = division.groups;
	} else {
		groupings = [{ name: division.name, ...aggregateGroups(division.groups) }];
	}

	const tables = groupings.map((grouping) => {
		const standings = calculateStandings(grouping.rosters, grouping.matches);

		const resolvedStandings = standings.map(({ rosterId, score }) => {
			const roster = grouping.rosters.find((roster) => roster.id === rosterId)!;

			return {
				score,
				roster
			};
		});

		return {
			name: grouping.name,
			standings: resolvedStandings
		};
	});

	return json({
		tables
	});
};
