import { command, query } from '$app/server';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import pickBanService from '$lib/server/pick-ban';
import { fullMatchQueryWithContext, roomStateQuery } from '$lib/server/db/helpers';
import { db, schema } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { RoomCloseReason, RoomStatus } from '$lib/pick-ban';
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
				status: RoomStatus.CANCELLED,
				cancelledById: user.id,
				closedAt: new Date(),
				closeReason: RoomCloseReason.CANCELLED
			})
			.where(and(eq(schema.room.matchId, matchId), isNull(schema.room.closeReason)));
	}
);

export const subscribeToRoom = query.live(
	z.object({ roomId: z.uuid() }),
	async function* ({ roomId }) {
		const room = await db.query.room.findFirst({
			...roomStateQuery,
			where: {
				id: roomId
			}
		});

		if (!room) {
			throw error(404, 'Room not found');
		}

		yield room;

		while (true) {
			await new Promise((f) => setTimeout(f, 1000));
		}
	}
);
