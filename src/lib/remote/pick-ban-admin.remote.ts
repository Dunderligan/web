import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import { PickBanMapType, WinCondition } from '$lib/pick-ban';
import { eq } from 'drizzle-orm';

export const createPickBanConfig = command(
	z.object({
		divisionId: z.uuid(),
		round: z.int().min(0).nullable()
	}),
	async ({ divisionId, round }) => {
		await roleGuard(AuthRole.ADMIN);

		const [config] = await db
			.insert(schema.pickBanConfig)
			.values({
				divisionId,
				round
			})
			.returning();

		return { config };
	}
);

const pickBanConfigValuesSchema = z.object({
	enabled: z.boolean().nullable(),
	decisionTimeoutSeconds: z.number().int().min(1).nullable(),
	allowConcedeFirstBan: z.boolean().nullable(),
	winCondition: z.enum(WinCondition).nullable(),
	mapCount: z.number().int().min(1).nullable(),
	mapType: z.enum(PickBanMapType).nullable(),
	setAllowedMapIds: z.boolean(),
	allowedMapIds: z.array(z.uuid()).nullable(),
	setAllowedGamemodeIds: z.boolean(),
	allowedGamemodeIds: z.array(z.uuid()).nullable(),
	setFirstGamemodeId: z.boolean(),
	firstGamemodeId: z.uuid().nullable(),
	restrictUsedGamemodes: z.boolean().nullable(),
	fixedMapIds: z.array(z.uuid()).nullable()
});

export const updatePickBanConfig = command(
	z.object({
		id: z.uuid(),
		values: pickBanConfigValuesSchema
	}),
	async ({ id, values }) => {
		await roleGuard(AuthRole.ADMIN);

		const [config] = await db
			.update(schema.pickBanConfig)
			.set(values)
			.where(eq(schema.pickBanConfig.id, id))
			.returning();

		return { config };
	}
);
