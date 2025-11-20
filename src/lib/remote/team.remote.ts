import { query } from '$app/server';
import { db, schema } from '$lib/server/db';
import { nestedGroupQuery } from '$lib/server/db/helpers';
import type { RosterWithGroup } from '$lib/types';
import { ilike } from 'drizzle-orm';
import z from 'zod';
import { adminGuard } from './auth.remote';

export const queryTeams = query(
	z.object({
		query: z.string(),
		excludeSeasonId: z.uuidv4().optional()
	}),
	async ({ query, excludeSeasonId }) => {
		await adminGuard();

		// gather rosters that match the query from any team/season
		const rosters = await db.query.roster.findMany({
			limit: 15,
			where: ilike(schema.roster.name, `%${query}%`),
			columns: {
				id: true,
				name: true,
				slug: true
			},
			with: {
				team: {
					columns: {
						id: true
					}
				},
				...nestedGroupQuery
			}
		});

		// group the rosters by their team
		const teams = new Map<string, RosterWithGroup[]>();

		for (const { team, ...roster } of rosters) {
			if (roster.group.division.season.id === excludeSeasonId) continue;

			const rosters = teams.get(team.id) ?? [];
			rosters.push(roster);
			teams.set(team.id, rosters);

			// return max 5 unique teams
			if (teams.size >= 5) break;
		}

		return teams;
	}
);
