import { command } from '$app/server';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import pickBanService from '$lib/server/pick-ban';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { RoomCloseReason, RoomState } from '$lib/pick-ban';
import { and, eq, isNull } from 'drizzle-orm';

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
		matchId: z.uuid()
	}),
	async ({ matchId }) => {
		const user = await roleGuard(AuthRole.ADMIN);

		await db
			.update(schema.room)
			.set({
				state: RoomState.CANCELLED,
				cancelledById: user.id,
				closedAt: new Date(),
				closeReason: RoomCloseReason.CANCELLED
			})
			.where(and(eq(schema.room.matchId, matchId), isNull(schema.room.closeReason)));
	}
);
