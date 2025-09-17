import { db, schema } from '$lib/server/db';
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
				columns: {
					id: true,
					name: true,
					slug: true
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
		rosters: data.rosters,
		group: {
			id: data.id,
			name: data.name,
			slug: data.slug
		},
		division: {
			id: data.division.id,
			name: data.division.name,
			slug: data.division.slug
		},
		season: {
			id: data.division.season.id,
			name: data.division.season.name,
			slug: data.division.season.slug
		}
	};
};
