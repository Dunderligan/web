import { db } from '#lib/server/db.ts';
import { entityQuery } from '#lib/server/db/helpers.ts';
import { hiddenSeasonFilter } from '#lib/server/db/hidden.js';

export const GET = async ({ locals }) => {
	const seasons = await db.query.season.findMany({
		where: {
			hidden: hiddenSeasonFilter(locals.user)
		},
		columns: {
			...entityQuery.columns,
			legacyRanks: true,
			hidden: true,
			startedAt: true,
			endedAt: true
		},
		orderBy: {
			startedAt: 'asc'
		},
		with: {
			divisions: {
				...entityQuery,
				with: {
					groups: entityQuery,
					brackets: {
						columns: {
							id: true,
							name: true
						}
					}
				}
			}
		}
	});

	return Response.json({
		seasons
	});
};
