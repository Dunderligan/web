import { db } from '$lib/server/db';
import { fullMatchColumns, groupMatchOrder as groupMatchOrder } from '$lib/server/db/helpers';
import { flattenGroup } from '$lib/util';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.group.findFirst({
		where: {
			id: params.id
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
				columns: fullMatchColumns
			},
			division: {
				with: {
					season: true
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
