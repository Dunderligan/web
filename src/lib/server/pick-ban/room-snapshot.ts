import { type RoomSnapshot } from '$lib/pick-ban';
import { isClosed } from '$lib/pick-ban/util';
import { db } from '../db';
import { roomStateQuery } from '../db/helpers';
import presence from './presence';
import roomEvents from './room-events';

/**
 * Loads the public room snapshot consumed by live queries.
 *
 * Returns `null` when the room has been deleted, which lets subscribers close
 * their streams instead of keeping stale state.
 */
export async function getRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
	const room = await db.query.room.findFirst({
		...roomStateQuery,
		where: {
			id: roomId
		}
	});

	if (!room) return null;

	const presenceState = await presence.list(roomId);

	return { ...room, presence: presenceState };
}

export async function publishRoom(roomId: string): Promise<void> {
	if (!roomEvents.hasSubscribers(roomId)) return;

	const snapshot = await getRoomSnapshot(roomId);
	if (snapshot) {
		roomEvents.publish(roomId, snapshot);

		if (isClosed(snapshot.status)) {
			roomEvents.close(roomId);
		}
	} else {
		roomEvents.close(roomId);
	}
}
