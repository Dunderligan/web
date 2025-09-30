import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load = async () => {
	const matches = db.query.match.findMany({
		limit: 3,
		orderBy: schema.match.playedAt,
		where: eq(schema.match.played, true),
		columns: {
			id: true,
			teamAScore: true,
			teamBScore: true,
			draws: true
		},
		with: {
			rosterA: {
				columns: {
					id: true,
					name: true,
					slug: true,
					seasonSlug: true
				}
			},
			rosterB: {
				columns: {
					id: true,
					name: true,
					slug: true,
					seasonSlug: true
				}
			}
		}
	});

	return {
		matches
	};
};
