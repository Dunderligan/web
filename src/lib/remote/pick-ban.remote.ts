import { command, getRequestEvent, query } from '$app/server';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/auth-role';
import pickBanService, { type RoomParticipant } from '$lib/server/pick-ban';
import { getRoomSnapshot, publishRoom } from '$lib/server/pick-ban/room-snapshot';
import { error } from '@sveltejs/kit';
import { MapOutcome, RoomStatus, type DecisionActor } from '$lib/pick-ban';
import presence from '$lib/server/pick-ban/presence';
import type { PresenceParticipant } from '$lib/server/pick-ban/presence-store';
import type { User } from '$lib/server/db/schema/auth';
import { decisionInputSchema } from '$lib/schemas';
import roomEvents from '$lib/server/pick-ban/room-events';
import { isClosed } from '$lib/pick-ban/util';

/** Yield at least this often so the live query doesn't time out due to inactivity. */
const ROOM_KEEPALIVE_INTERVAL_MS = 15 * 1000;

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

		if (!ready) {
			// publish room so presence changes are reflected immediately
			await publishRoom(roomId);
			return;
		}

		const roomPresence = await presence.list(roomId);
		const readySlots = new Set(
			roomPresence.members.filter((member) => member.isCaptain && member.ready).map((m) => m.slot)
		);

		if (readySlots.size < 2) {
			// simiarly, publish room to broadcast presence
			// startRoom publishes internally, so only do it here to avoid duplicate events
			await publishRoom(roomId);
		} else {
			await pickBanService.startRoom(roomId);
		}
	}
);

export const subscribeToRoom = query.live(
	z.object({ roomId: z.uuid() }),
	async function* ({ roomId }) {
		let latestSnapshot = await getRoomSnapshot(roomId);
		if (!latestSnapshot || isClosed(latestSnapshot?.status)) {
			return;
		}

		yield latestSnapshot;

		const subscriber = roomEvents.subscribe(roomId);
		try {
			while (true) {
				const keepalive = new Promise<void>((resolve) =>
					setTimeout(resolve, ROOM_KEEPALIVE_INTERVAL_MS)
				);
				const result = await Promise.race([subscriber.next(), keepalive.then(() => null)]);

				if (result === null) {
					// yield at least every ROOM_KEEPALIVE_INTERVAL_MS so the live query doesn't time out
					yield latestSnapshot;
				} else if (result.done) {
					yield latestSnapshot;
					break;
				} else {
					latestSnapshot = result.value;
					yield latestSnapshot;
				}
			}
		} finally {
			subscriber.close();
		}
	}
);

export const makeDecision = command(
	z.object({
		roomId: z.uuid(),
		decision: decisionInputSchema
	}),
	async ({ roomId, decision: decisionInput }) => {
		const { actor, participant } = await requireActingCaptain(roomId);

		await pickBanService.applyDecision(roomId, actor, () => ({
			slot: participant.slot,
			decision: decisionInput
		}));
	}
);

export const submitReport = command(
	z.object({
		roomId: z.uuid(),
		outcome: z.enum(MapOutcome)
	}),
	async ({ roomId, outcome }) => {
		const { user, participant } = await requireActingCaptain(roomId);

		await pickBanService.submitReport(roomId, user.id, participant.slot, outcome);
	}
);

export const resolveResult = command(
	z.object({
		roomId: z.uuid(),
		outcome: z.enum(MapOutcome)
	}),
	async ({ roomId, outcome }) => {
		const user = await roleGuard(AuthRole.ADMIN);

		await pickBanService.resolveResult(roomId, user.id, outcome);
	}
);

/** Requires a signed-in captain participant of an in-progress room. */
async function requireActingCaptain(
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
