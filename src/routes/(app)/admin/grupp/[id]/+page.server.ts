import { db } from '$lib/server/db';
import { groupMatchOrder as groupMatchOrder } from '$lib/server/db/helpers';
import { flattenGroup } from '$lib/util';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.group.findFirst({
		where: {
			id: params.id
		},
		columns: {
			createdAt: false,
			divisionId: false
		},
		with: {
			rosters: {
				orderBy: { name: 'asc' },
				columns: {
					id: true,
					name: true,
					slug: true
				}
			},
			matches: {
				orderBy: groupMatchOrder,
				columns: {
					createdAt: false,
					order: false
				}
			},
			division: {
				columns: {
					createdAt: false,
					seasonId: false
				},
				with: {
					season: {
						columns: {
							createdAt: false
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	return {
		...flattenGroup(data)
	};
};
