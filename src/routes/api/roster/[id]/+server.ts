import { db } from '#lib/server/db.ts';
import { entityQuery, memberQuery, nestedGroupQuery } from '#lib/server/db/helpers.ts';
import { error } from '@sveltejs/kit';

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

	return Response.json(roster);
};
