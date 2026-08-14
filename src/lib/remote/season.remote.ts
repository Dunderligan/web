import { command, query } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/authRole';
import { entityQuery } from '$lib/server/db/helpers';
import { createDivision } from './division.remote';

export const createSeason = command(
	z.object({
		name: z.string(),
		startedAt: z.date(),
		legacyRanks: z.boolean(),
		hidden: z.boolean()
	}),
	async ({ name, startedAt, legacyRanks, hidden }) => {
		await roleGuard(AuthRole.ADMIN);

		const slug = toSlug(name);

		const [season] = await db
			.insert(schema.season)
			.values({
				name,
				slug,
				startedAt,
				legacyRanks,
				hidden
			})
			.returning();

		await createDivision({ name: 'Division 1', seasonId: season.id });

		return { season };
	}
);

export const createRegistration = command(
	z.object({
		openDate: z.date(),
		closeDate: z.date(),
		seasonId: z.uuid()
	}),
	async ({ openDate, closeDate, seasonId }) => {
		await roleGuard(AuthRole.ADMIN);

		const [registration] = await db
			.insert(schema.registration)
			.values({
				openDate,
				closeDate,
				seasonId
			})
			.returning();

		return { registration };
	}
);

export const updateSeason = command(
	z.object({
		id: z.uuid(),
		name: z.string(),
		startedAt: z.date(),
		endedAt: z.date().nullish(),
		legacyRanks: z.boolean(),
		legacySeeding: z.boolean(),
		hidden: z.boolean(),
		spinoff: z.boolean()
	}),
	async ({ id, name, ...data }) => {
		await roleGuard(AuthRole.ADMIN);

		const slug = toSlug(name);

		await db
			.update(schema.season)
			.set({ name, slug, ...data })
			.where(eq(schema.season.id, id));
	}
);

export const deleteSeason = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.delete(schema.season).where(eq(schema.season.id, id));
	}
);

export const getDivisionsBySeason = query(
	z.object({
		seasonId: z.uuid()
	}),
	async ({ seasonId }) => {
		await roleGuard(AuthRole.ADMIN);

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
