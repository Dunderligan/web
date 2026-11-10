import {
	calculateStandings,
	type RosterInfo,
	type SeedOptions,
	type TableScore
} from '$lib/standings';
import type { LogicalMatch } from '$lib/types';
import { aggregateGroups } from '$lib/util';

export type Table = {
	id: string;
	title: string | null;
	adminUrl: string;
	standings: {
		rosterId: string;
		score: TableScore;
	}[];
};

export function generateDivisionStandings<
	G extends { id: string; name: string; rosters: R[]; matches: M[] },
	R extends RosterInfo,
	M extends LogicalMatch
>(
	division: {
		id: string;
		groupwiseStandings: boolean;
		groups: G[];
	},
	seedOptions: SeedOptions
): Table[] {
	let groupings;
	if (division.groupwiseStandings) {
		groupings = division.groups.map((group) => ({
			id: group.id,
			title: group.name,
			matches: group.matches,
			rosters: group.rosters,
			adminUrl: `/admin/grupp/${group.id}`
		}));
	} else {
		const { rosters, matches } = aggregateGroups(division.groups);

		groupings = [
			{
				id: division.id,
				title: null,
				matches,
				rosters,
				adminUrl: `/admin/division/${division.id}`
			}
		];
	}

	const tables = groupings.map(({ matches, rosters, ...table }) => {
		const standings = calculateStandings(rosters, matches, seedOptions);

		return {
			...table,
			standings
		};
	});

	return tables;
}

export function getRosterSeed(tables: Table[], rosterId: string): number | null {
	for (const table of tables) {
		const seed = table.standings.findIndex((row) => row.rosterId === rosterId);
		if (seed !== -1) {
			return seed;
		}
	}
	return null;
}
