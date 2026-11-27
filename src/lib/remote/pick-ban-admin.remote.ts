import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import {
	configRowToMapScope,
	InvalidPickBanConfigError,
	normalizeValues,
	PickBanMapType,
	resolveConfig,
	WinCondition
} from '$lib/pick-ban';
import { eq } from 'drizzle-orm';
import pickBanService from '$lib/server/pick-ban';
import { error } from '@sveltejs/kit';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';

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

		const config = await db.query.pickBanConfig.findFirst({
			where: {
				id
			}
		});

		if (!config) {
			throw error(404, 'Pick-ban config not found');
		}

		const normalized = normalizeValues(values);

		const scope = configRowToMapScope(config);
		const applicableConfigs = await pickBanService.getConfigsByScope(scope);
		const parentConfigs = applicableConfigs.filter((c) => c.id !== config.id);

		try {
			resolveConfig(scope, [{ id, ...scope, ...normalized }, ...parentConfigs]);
		} catch (err) {
			if (err instanceof InvalidPickBanConfigError) {
				throw error(400, 'Invalid pick-ban config.');
			}
			throw err;
		}

		const [updatedConfig] = await db
			.update(schema.pickBanConfig)
			.set(normalized)
			.where(eq(schema.pickBanConfig.id, config.id))
			.returning();

		return { config: updatedConfig };
	}
);

export const deletePickBanConfig = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await roleGuard(AuthRole.ADMIN);

		await db.delete(schema.pickBanConfig).where(eq(schema.pickBanConfig.id, id));
	}
);

export const createRoom = command(
	z.object({
		matchId: z.uuid()
	}),
	async ({ matchId }) => {
		const user = await roleGuard(AuthRole.ADMIN);

		const match = await db.query.match.findFirst({
			...fullMatchQueryWithContext,
			where: {
				id: matchId
			}
		});

		if (!match) {
			throw error(404, 'Match not found');
		}

		const roomId = await pickBanService.createRoom(match, user.id);

		return { roomId };
	}
);

export const cancelRoom = command(
	z.object({
		roomId: z.uuid()
	}),
	async ({ roomId }) => {
		const user = await roleGuard(AuthRole.ADMIN);
		await pickBanService.cancelRoom(roomId, user.id);
	}
);

export const deleteRoom = command(
	z.object({
		roomId: z.uuid()
	}),
	async ({ roomId }) => {
		await roleGuard(AuthRole.ADMIN);
		await pickBanService.deleteRoom(roomId);
	}
);
