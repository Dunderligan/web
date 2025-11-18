import { form, query } from '$app/server';
import { ilike, like } from 'drizzle-orm';
import { db, schema } from './server/db';
import * as z from 'zod';
import { nestedGroupQuery } from './server/db/helpers';
import type { RosterWithGroup } from './types';
import { error } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3_BUCKET_NAME } from '$env/static/private';
import S3 from './server/s3';

export const queryTeams = query(
	z.object({
		query: z.string(),
		excludeSeasonId: z.uuidv4().optional()
	}),
	async ({ query, excludeSeasonId }) => {
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

export const uploadRosterLogo = form(async (data) => {
	const file = data.get('file') as File;
	if (!file) {
		error(400, 'No file provided');
	}

	const rosterId = data.get('rosterId') as string;
	if (!rosterId) {
		error(400, 'No rosterId provided');
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	const command = new PutObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: `logos/${rosterId}.png`,
		Body: buffer,
		ContentType: `image/png`
	});

	await S3.send(command);

	console.log('uploaded logo');
});
