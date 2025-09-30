import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const groups = await db.query.group.findMany({
		where: eq(schema.group.divisionId, params.id),
		columns: {},
		with: {
			rosters: {
				columns: {
					id: true,
					name: true,
					slug: true
				}
			}
		}
	});

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

	if (!groups || !matches) {
		error(404);
	}

	const rosters = groups.flatMap((group) => group.rosters);

	return { matches, rosters };
};
