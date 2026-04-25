import { placementFromFinalMatch } from '$lib/match';
import { db } from '$lib/server/db';
import {
	entityQuery,
	fullMatchQuery,
	hiddenGroupFilter,
	memberQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';
import overwatch from '$lib/server/overwatch';
import { error } from '@sveltejs/kit';

const finalMatchQuery = {
	...fullMatchQuery,
	limit: 1,
	orderBy: {
		round: 'asc'
	}
} as const;

export const load = async ({ params, locals }) => {
	const battletag = params.battletag.replace('-', '#');

	const data = await db.query.player.findFirst({
		where: {
			battletag
		},
		columns: {
			id: true,
			battletag: true,
			description: true,
			pronouns: true,
			overwatchProfileSlug: true
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
							name: true
						}
					}
				}
			},
			aliases: {
				columns: {
					name: true
				}
			}
		}
	});

	if (!data) {
		throw error(404);
	}

	const player = {
		...data,
		memberships: data.memberships.map(
			({ roster: { matchesAsA, matchesAsB, ...roster }, ...membership }) => {
				const finalMatch =
					[...matchesAsA, ...matchesAsB].sort((a, b) => (a.round ?? 0) - (b.round ?? 0)).at(0) ??
					null;

				const placement = finalMatch ? placementFromFinalMatch(finalMatch, roster.id) : null;

				return {
					...membership,
					roster,
					finalMatch,
					placement
				};
			}
		)
	};

	const profile = await overwatch.getProfile(battletag, data.overwatchProfileSlug);

	return {
		player,
		profile
	};
};
