import { command } from '$app/server';
import { AuthRole } from '$lib/authRole';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { roleGuard } from './auth.remote';

export const createAwardType = command(
	z.object({
		name: z.string().min(1),
		showDivision: z.boolean()
	}),
	async ({ name, showDivision }) => {
		await roleGuard(AuthRole.MODERATOR);

		const [awardType] = await db
			.insert(schema.awardType)
			.values({
				name,
				showDivision
			})
			.returning();

		return { awardType };
	}
);

export const updateAwardType = command(
	z.object({
		id: z.uuid(),
		name: z.string().min(1),
		showDivision: z.boolean()
	}),
	async ({ id, name, showDivision }) => {
		await roleGuard(AuthRole.MODERATOR);

		const [awardType] = await db
			.update(schema.awardType)
			.set({ name, showDivision })
			.where(eq(schema.awardType.id, id))
			.returning();

		return { awardType };
	}
);

export const deleteAwardType = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.delete(schema.awardType).where(eq(schema.awardType.id, id));
	}
);

export const createPlayerAward = command(
	z.object({
		awardTypeId: z.uuid(),
		playerId: z.uuid(),
		divisionId: z.uuid().nullable()
	}),
	async ({ awardTypeId, playerId, divisionId }) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.insert(schema.playerAward).values({
			awardTypeId,
			playerId,
			divisionId
		});
	}
);

export const updatePlayerAward = command(
	z.object({
		id: z.uuid(),
		description: z.string().nullable()
	}),
	async ({ id, description }) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.update(schema.playerAward).set({ description }).where(eq(schema.playerAward.id, id));
	}
);

export const deletePlayerAward = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.MODERATOR);

		await db.delete(schema.playerAward).where(eq(schema.playerAward.id, id));
	}
);
