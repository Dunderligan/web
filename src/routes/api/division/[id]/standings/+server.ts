import { db } from '#lib/server/db.ts';
import { fullGroupQuery } from '#lib/server/db/helpers.ts';
import { generateDivisionStandings } from '#lib/server/standings.ts';
import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const division = await db.query.division.findFirst({
		where: {
			id: params.id
		},
		columns: {
			id: true,
			name: true,
			groupwiseStandings: true
		},
		with: {
			season: {
				columns: {
					legacySeeding: true
				}
			},
			groups: fullGroupQuery
		}
	});

	if (!division) {
		throw error(404);
	}

	const tables = generateDivisionStandings(division, { legacy: division.season.legacySeeding });

	return Response.json({
		tables
	});
};
