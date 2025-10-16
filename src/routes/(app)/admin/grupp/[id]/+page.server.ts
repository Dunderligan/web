import { db, schema } from '$lib/server/db';
import { flattenGroup } from '$lib/util';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.group.findFirst({
		where: eq(schema.group.id, params.id),
		columns: {
			createdAt: false,
			divisionId: false
		},
		with: {
			rosters: {
				orderBy: schema.roster.name,
				columns: {
					id: true,
					name: true,
					slug: true
				}
			},
			matches: {
				orderBy: schema.match.playedAt,
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
