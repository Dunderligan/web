import { db } from '$lib/server/db';
import { entityQuery, hiddenSeasonFilter } from '$lib/server/db/helpers';
import { json } from '@sveltejs/kit';

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

	return json({
		seasons
	});
};
