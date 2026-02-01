import { command, query } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { adminGuard } from './auth.remote';
import { entityQuery } from '$lib/server/db/helpers';

export const createSeason = command(
	z.object({
		name: z.string(),
		startedAt: z.date(),
		legacyRanks: z.boolean(),
		hidden: z.boolean()
	}),
	async ({ name, startedAt, legacyRanks, hidden }) => {
		await adminGuard();

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

		return { season };
	}
);

export const createRegistration = command(
	z.object({
		url: z.url(),
		openDate: z.date(),
		closeDate: z.date(),
		seasonId: z.uuid()
	}),
	async ({ url, openDate, closeDate, seasonId }) => {
		await adminGuard();

		const [registration] = await db
			.insert(schema.registration)
			.values({
				url,
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
		startedAt: z.date(),
		endedAt: z.date().nullish(),
		hidden: z.boolean(),
		registration: z
			.object({
				url: z.url(),
				openDate: z.date(),
				closeDate: z.date()
			})
			.nullish()
	}),
	async ({ id, startedAt, endedAt, hidden, registration }) => {
		await adminGuard();

		await db.transaction(async (tx) => {
			await tx
				.update(schema.season)
				.set({ startedAt, endedAt, hidden })
				.where(eq(schema.season.id, id));

			if (registration) {
				console.log(registration);

				await tx
					.update(schema.registration)
					.set(registration)
					.where(eq(schema.registration.seasonId, id));
			}
		});
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

export const deleteRegistration = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.registration).where(eq(schema.registration.id, id));
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
