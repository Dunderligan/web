import { command, getRequestEvent, query } from '$app/server';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import pickBanService, { type RoomParticipant } from '$lib/server/pick-ban';
import { fullMatchQueryWithContext, roomStateQuery } from '$lib/server/db/helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { RoomCloseReason, RoomStatus, type DecisionActor } from '$lib/pick-ban';
import presence from '$lib/server/presence';
import type { PresenceParticipant } from '$lib/server/presence-store';
import type { User } from '$lib/server/db/schema/auth';
import { decisionInputSchema } from '$lib/schemas';

const ROOM_POLL_INTERVAL_MS = 1000;
/** Yield at least this often so the live query doesn't time out due to inactivity. */
const ROOM_KEEPALIVE_INTERVAL_MS = 15 * 1000;

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

		const success = await pickBanService.mutateRoom(roomId, async (_tx, _config, state) => {
			if (state.status === RoomStatus.FINISHED || state.status === RoomStatus.CANCELLED) {
				return null;
			}

			return {
				status: RoomStatus.CANCELLED,
				cancelledById: user.id,
				closedAt: new Date(),
				closeReason: RoomCloseReason.CANCELLED
			};
		});

		if (success) {
			await presence.clear(roomId);
		}
	}
);

/** Registers or refreshes the signed-in viewer's presence in a room. */
export const heartbeatRoom = command(z.object({ roomId: z.uuid() }), async ({ roomId }) => {
	const { participant } = await requireParticipant(roomId);
	await presence.heartbeat(roomId, participantToPresence(participant));
});

/** Removes the signed-in viewer from a room's presence when they leave the page. */
export const leaveRoom = command(z.object({ roomId: z.uuid() }), async ({ roomId }) => {
	const { locals } = getRequestEvent();
	if (!locals.user) return;

	const participant = await pickBanService.getRoomParticipant(roomId, locals.user);
	if (!participant) return;

	await presence.leave(roomId, participant.userId);
});

/**
 * Confirms or withdraws the signed-in captain's readiness for their own team.
 * Starting the room requires both teams to be ready; the server never starts it otherwise.
 */
export const setRoomReady = command(
	z.object({
		roomId: z.uuid(),
		ready: z.boolean()
	}),
	async ({ roomId, ready }) => {
		const { participant } = await requireParticipant(roomId);

		if (!participant.member.isCaptain) {
			throw error(403, 'Only team captains can confirm readiness');
		}

		if (participant.roomStatus !== RoomStatus.OPEN) {
			throw error(409, 'The room is no longer waiting for teams');
		}

		// A captain readying up counts as being present even if their heartbeat is delayed.
		await presence.heartbeat(roomId, participantToPresence(participant));
		await presence.setReady(roomId, participant.userId, ready);

		if (!ready) return { started: false };

		const snapshot = await presence.list(roomId);
		const readySlots = new Set(
			snapshot.members.filter((member) => member.isCaptain && member.ready).map((m) => m.slot)
		);

		if (readySlots.size < 2) return { started: false };

		return { started: await pickBanService.startRoom(roomId) };
	}
);

export const subscribeToRoom = query.live(
	z.object({ roomId: z.uuid() }),
	async function* ({ roomId }) {
		let lastSnapshot: string | null = null;
		let lastYieldAt = 0;

		while (true) {
			const room = await db.query.room.findFirst({
				...roomStateQuery,
				where: {
					id: roomId
				}
			});

			// A deleted room ends the stream. Viewers keep the last state they saw.
			if (!room) return;

			const presenceState = await presence.list(roomId);
			const snapshot = { ...room, presence: presenceState };
			const serialized = JSON.stringify(snapshot);
			const now = Date.now();

			if (serialized !== lastSnapshot || now - lastYieldAt >= ROOM_KEEPALIVE_INTERVAL_MS) {
				yield snapshot;
				lastSnapshot = serialized;
				lastYieldAt = now;
			}

			if (room.status === RoomStatus.FINISHED || room.status === RoomStatus.CANCELLED) {
				return;
			}

			await new Promise((resolve) => setTimeout(resolve, ROOM_POLL_INTERVAL_MS));
		}
	}
);

export const makeDecision = command(
	z.object({
		roomId: z.uuid(),
		decision: decisionInputSchema
	}),
	async ({ roomId, decision: decisionInput }) => {
		const { actor, participant } = await requireActor(roomId);

		await pickBanService.applyDecision(roomId, actor, decisionInput, participant.slot);
	}
);

/** Requires a signed-in captain participant of an in-progress room. */
async function requireActor(
	roomId: string
): Promise<{ user: User; participant: RoomParticipant; actor: DecisionActor }> {
	const { user, participant } = await requireParticipant(roomId);

	if (participant.roomStatus !== RoomStatus.IN_PROGRESS) {
		throw error(409, 'The room is no longer active.');
	}

	if (!participant.member.isCaptain) {
		throw error(403, 'Only team captains can make decisions.');
	}

	return { user, participant, actor: { type: 'captain', userId: user.id } };
}

/** Requires a signed-in participant of a room that still accepts presence. */
async function requireParticipant(
	roomId: string
): Promise<{ user: User; participant: RoomParticipant }> {
	const { locals } = getRequestEvent();
	const user = locals.user;

	if (!user) {
		throw error(401, 'Not logged in.');
	}

	const participant = await pickBanService.getRoomParticipant(roomId, user);
	if (!participant) {
		throw error(403, 'Not a participant in this room.');
	}

	if (
		participant.roomStatus !== RoomStatus.OPEN &&
		participant.roomStatus !== RoomStatus.IN_PROGRESS
	) {
		throw error(409, 'The room is closed.');
	}

	return { user, participant };
}

function participantToPresence(participant: RoomParticipant): PresenceParticipant {
	return {
		battletag: participant.member.player.battletag,
		slot: participant.slot,
		userId: participant.userId,
		isCaptain: participant.member.isCaptain
	};
}
