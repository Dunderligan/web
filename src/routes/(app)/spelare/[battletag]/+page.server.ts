import { getRosterPlacement } from '$lib/match';
import { db, schema } from '$lib/server/db';
import {
	entityQuery,
	fullMatchQuery,
	memberQuery,
	nestedBracketQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';
import { hiddenDivisionFilter, hiddenGroupFilter } from '$lib/server/db/hidden';
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
					hero: true
				}
			},
			aliases: true
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

	const awards = await db.query.playerAward.findMany({
		where: {
			playerId: player.id,
			OR: [
				{
					divisionId: {
						isNull: true as true
					}
				},
				{
					division: hiddenDivisionFilter(locals.user)
				}
			]
		},
		with: {
			awardType: {
				columns: {
					id: true,
					name: true,
					showDivision: true
				}
			},
			division: {
				columns: {
					id: true,
					name: true,
					slug: true
				},
				with: {
					season: {
						columns: {
							id: true,
							name: true,
							slug: true,
							startedAt: true
						}
					}
				}
			}
		}
	});

	return {
		profile,
		awards,
		player: {
			...player,
			memberships
		}
	};
};
