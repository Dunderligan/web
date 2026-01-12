import { db } from '$lib/server/db';
import { entityQuery } from '$lib/server/db/helpers';
import { json } from '@sveltejs/kit';

export const GET = async () => {
	const rosters = await db.query.season.findMany({
		columns: {
			...entityQuery.columns,
			legacyRanks: true
		},
		orderBy: {
			createdAt: 'desc'
		},
		with: {
			divisions: {
				...entityQuery,
				with: {
					groups: {
						...entityQuery,
						with: {
							rosters: entityQuery
						}
					}
				}
			}
		}
	});

	const response = {
		results: rosters
	};

	return json(response);
};
