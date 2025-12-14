import { query } from '$app/server';
import { db } from '$lib/server/db';
import { nestedGroupQuery } from '$lib/server/db/helpers';
import type { RosterWithGroup } from '$lib/types';
import z from 'zod';
import { adminGuard } from './auth.remote';

export const queryTeams = query(
	z.object({
		query: z.string(),
		excludeSeasonId: z.uuid().optional(),
		excludeTeamId: z.uuid().optional()
	}),
	async ({ query, excludeSeasonId, excludeTeamId }) => {
		await adminGuard();

		console.log('Hello?');

		// gather rosters that match the query from any team/season
		const rosters = await db.query.roster.findMany({
			limit: 15,
			where: {
				name: { ilike: `%${query}%` },
				...(excludeSeasonId && {
					group: { division: { season: { NOT: { id: excludeSeasonId } } } }
				}),
				...(excludeTeamId && {
					team: { NOT: { id: excludeTeamId } }
				})
			},
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
				group: nestedGroupQuery
			}
		});

		// group the rosters by their team
		const teams = new Map<string, RosterWithGroup[]>();

		for (const { team, ...roster } of rosters) {
			const teamRosters = teams.get(team.id) ?? [];
			teamRosters.push(roster);
			teams.set(team.id, teamRosters);

			// return max 5 unique teams
			if (teams.size >= 5) break;
		}

		return teams;
	}
);
