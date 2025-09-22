import { db, schema } from '$lib/server/db/index.js';
import { calculateStandings } from '$lib/util.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	const data = await db.query.season.findFirst({
		where: eq(schema.season.slug, params.slug),
		columns: {
			name: true,
			slug: true
		},
		with: {
			divisions: {
				orderBy: schema.division.name,
				columns: {
					id: true,
					name: true,
					slug: true
				},
				with: {
					groups: {
						orderBy: schema.division.name,
						columns: {
							id: true,
							name: true,
							slug: true
						},
						with: {
							rosters: {
								columns: {
									id: true,
									name: true,
									slug: true
								}
							},
							matches: {
								where: eq(schema.match.played, true),
								columns: {
									teamAScore: true,
									teamBScore: true,
									draws: true,
									rosterAId: true,
									rosterBId: true
								}
							}
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	const tables = new Map(
		data.divisions.flatMap((div) =>
			div.groups.map((group) => [group.id, calculateStandings(group.rosters, group.matches)])
		)
	);

	return { season: data, tables };
};
