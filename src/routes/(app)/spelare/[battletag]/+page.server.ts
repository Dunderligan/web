import { getRosterPlacement } from '$lib/match';
import { db, schema } from '$lib/server/db';
import {
	entityQuery,
	fullMatchQuery,
	memberQuery,
	nestedBracketQuery,
	nestedDivisionQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';
import { hiddenGroupFilter } from '$lib/server/db/hidden';
import overwatch from '$lib/server/overwatch';
import { error } from '@sveltejs/kit';
import { eq, inArray, not, sql, and } from 'drizzle-orm';

const finalMatchQuery = {
	...fullMatchQuery,
	with: {
		bracket: nestedBracketQuery,
		...fullMatchQuery.with
	},
	limit: 1,
	where: {
		round: {
			isNotNull: true
		}
	},
	orderBy: {
		round: 'asc'
	}
} as const;

export const load = async ({ params, locals }) => {
	const battletag = params.battletag.replace('-', '#');

	const player = await db.query.player.findFirst({
		where: {
			battletag
		},
		with: {
			socials: {
				columns: {
					platform: true,
					url: true
				}
			},
			memberships: {
				columns: memberQuery.columns,
				where: {
					roster: {
						group: hiddenGroupFilter(locals.user)
					}
				},
				with: {
					roster: {
						...entityQuery,
						with: {
							group: nestedGroupQuery,
							matchesAsA: finalMatchQuery,
							matchesAsB: finalMatchQuery
						}
					}
				}
			},
			signatureHeroes: {
				columns: {},
				with: {
					hero: {
						columns: {
							id: false
						}
					}
				}
			},
			aliases: true,
			awards: {
				columns: {
					id: true,
					description: true
				},
				with: {
					awardType: true,
					division: nestedDivisionQuery
				}
			}
		}
	});

	if (!player) {
		throw error(404);
	}

	const divisionIds = player.memberships.map((m) => m.roster.group.division.id);

	const { group, roster } = schema;

	const divisionCounts = await db
		.select({
			divisionId: group.divisionId,
			rosterCount: sql<number>`count(*)`
		})
		.from(roster)
		.innerJoin(group, eq(roster.groupId, group.id))
		.where(and(inArray(group.divisionId, divisionIds), not(roster.resigned)))
		.groupBy(group.divisionId);

	const rosterCountByDivision = new Map(
		divisionCounts.map((tuple) => [tuple.divisionId, tuple.rosterCount])
	);

	// calculate placements and final matches to each membership
	const memberships = player.memberships.map(({ roster, ...membership }) => {
		const rosterCount = rosterCountByDivision.get(roster.group.division.id) ?? 0;

		const { finalMatch, placement } = getRosterPlacement(
			[...roster.matchesAsA, ...roster.matchesAsB],
			roster.id,
			rosterCount
		);

		return {
			...membership,
			roster,
			finalMatch,
			placement
		};
	});

	const profile = await overwatch.getProfile(battletag, player.overwatchProfileSlug);

	return {
		profile,
		player: {
			...player,
			memberships
		}
	};
};
