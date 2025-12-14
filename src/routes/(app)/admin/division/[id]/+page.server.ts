import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.division.findFirst({
		where: {
			id: params.id
		},
		columns: {
			createdAt: false
		},
		with: {
			groups: {
				orderBy: { name: 'asc' },
				columns: {
					createdAt: false,
					divisionId: false
				},
				with: {
					rosters: {
						columns: {
							id: true,
							name: true,
							slug: true
						}
					}
				}
			},
			season: {
				columns: {
					createdAt: false
				}
			},
			matches: {
				orderBy: { order: 'asc' }
			}
		}
	});

	if (!data) {
		error(404);
	}

	const { matches, ...division } = data;

	return { division, matches };
};
