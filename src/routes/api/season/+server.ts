import { db } from '$lib/server/db';
import { entityQuery } from '$lib/server/db/helpers';
import { json } from '@sveltejs/kit';

export const GET = async () => {
	const seasons = await db.query.season.findMany({
		columns: {
			...entityQuery.columns,
			legacyRanks: true,
			hidden: true
		},
		orderBy: {
			startedAt: 'desc'
		},
		with: {
			divisions: {
				...entityQuery,
				with: {
					groups: entityQuery
				}
			}
		}
	});

	return json({
		seasons
	});
};
