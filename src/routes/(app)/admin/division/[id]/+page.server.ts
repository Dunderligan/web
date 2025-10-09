import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.division.findFirst({
		where: eq(schema.division.id, params.id),
		columns: {
			createdAt: false
		},
		with: {
			groups: {
				orderBy: schema.group.name,
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
			matches: {}
		}
	});

	if (!data) {
		error(404);
	}

	const matches = await db.query.match.findMany({
		where: eq(schema.match.divisionId, params.id),
		orderBy: schema.match.order,
		columns: {
			id: true,
			rosterAId: true,
			rosterBId: true,
			teamAScore: true,
			teamBScore: true,
			draws: true,
			nextMatchId: true,
			played: true,
			order: true
		}
	});

	return { division: data, matches };
};
