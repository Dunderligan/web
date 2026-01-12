import { command, query } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { adminGuard } from './auth.remote';
import { entityQuery, nestedDivisionQuery } from '$lib/server/db/helpers';

export const createSeason = command(
	z.object({
		name: z.string(),
		startedAt: z.date(),
		legacyRanks: z.boolean()
	}),
	async ({ name, startedAt, legacyRanks }) => {
		await adminGuard();

		const slug = toSlug(name);

		const [season] = await db
			.insert(schema.season)
			.values({
				name,
				slug,
				startedAt,
				legacyRanks
			})
			.returning();

		return { season };
	}
);

export const updateSeason = command(
	z.object({
		id: z.uuid(),
		startedAt: z.date(),
		endedAt: z.date().nullish()
	}),
	async ({ id, startedAt, endedAt }) => {
		await adminGuard();

		await db.update(schema.season).set({ startedAt, endedAt }).where(eq(schema.season.id, id));
	}
);

export const deleteSeason = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.season).where(eq(schema.season.id, id));
	}
);

export const getDivisionsBySeason = query(
	z.object({
		seasonId: z.uuid()
	}),
	async ({ seasonId }) => {
		await adminGuard();

		const divisions = await db.query.division.findMany({
			where: {
				seasonId
			},
			orderBy: {
				name: 'asc'
			},
			...entityQuery,
			with: {
				groups: entityQuery
			}
		});

		return { divisions };
	}
);
