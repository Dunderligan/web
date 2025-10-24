import { query } from '$app/server';
import { ilike, like } from 'drizzle-orm';
import { db, schema } from './server/db';
import * as z from 'zod';
import { nestedGroupQuery } from './server/db/helpers';
import type { BaseNestedGroup, Roster, RosterWithGroup } from './types';

export const queryTeams = query(
	z.object({
		query: z.string(),
		excludeGroupId: z.uuidv4().optional()
	}),
	async ({ query, excludeGroupId }) => {
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

		const teams = new Map<string, RosterWithGroup[]>();

		for (const { team, ...roster } of rosters) {
			if (roster.group.id === excludeGroupId) continue;

			const list = teams.get(team.id) ?? [];
			list.push(roster);
			teams.set(team.id, list);

			// return max 5 teams
			if (teams.size >= 5) break;
		}

		return teams;
	}
);
