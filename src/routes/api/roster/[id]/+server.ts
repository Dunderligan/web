import { db } from '$lib/server/db';
import { entityQuery, memberQuery, nestedGroupQuery } from '$lib/server/db/helpers';
import { json, error } from '@sveltejs/kit';


export const GET = async ({ params }) => {
	const roster = await db.query.roster.findFirst({
		...entityQuery,
		where: {
			id: params.id
		},
		with: {
			group: nestedGroupQuery,
			members: memberQuery,
			team: {
				columns: {
					id: true
				}
			}
		}
	});

	if (!roster) {
		throw error(404);
	}

	return json(roster);
};
