import {
	nestedGroupQuery,
	memberQuery,
	fullMatchQueryWithContext,
	entityQuery
} from '$lib/server/db/helpers';
import { hiddenGroupFilter } from '$lib/server/db/hidden.js';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { compareMatchDates, getRosterPlacement } from '$lib/match.js';
import { and, eq, not, sql } from 'drizzle-orm';

export const load = async ({ params, locals }) => {
	const roster = await db.query.roster.findFirst({
		where: {
			slug: params.roster,
			group: {
				division: {
					season: {
						slug: params.season
					}
				}
			}
		},
		columns: entityQuery.columns,
		with: {
			members: memberQuery,
			matchesAsA: fullMatchQueryWithContext,
			matchesAsB: fullMatchQueryWithContext,
			team: {
				columns: {},
				with: {
					socials: {
						columns: {
							platform: true,
							url: true
						}
					},
					rosters: {
						columns: entityQuery.columns,
						where: {
							group: hiddenGroupFilter(locals.user)
						},
						with: {
							group: nestedGroupQuery
						}
					}
				}
			}
		}
	});

	if (!roster) {
		error(404);
	}

	const rosterInfo = roster.team.rosters.find((r) => r.id === roster.id)!;

	if (!rosterInfo) {
		// our current roster is in a hidden season we can't access
		error(404);
	}

	const matches = [...roster.matchesAsA, ...roster.matchesAsB].sort((a, b) =>
		compareMatchDates(a, b)
	);

	const rosterCount = await getRosterCount(rosterInfo.group.division.id);
	const { placement } = getRosterPlacement(matches, roster.id, rosterCount);

	return { roster: { ...roster, ...rosterInfo }, matches, placement };
};

async function getRosterCount(divisionId: string) {
	const { group, roster } = schema;

	const [{ rosterCount }] = await db
		.select({ rosterCount: sql<number>`count(*)` })
		.from(roster)
		.innerJoin(group, eq(roster.groupId, group.id))
		.where(and(eq(group.divisionId, divisionId), not(roster.resigned)));

	return rosterCount;
}
