import { db } from '$lib/server/db';
import { fullGroupQuery } from '$lib/server/db/helpers';
import { generateDivisionStandings } from '$lib/server/standings.js';
import { json, error } from '@sveltejs/kit';

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

	return json({
		tables
	});
};
