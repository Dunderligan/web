import { RoomStatus } from '$lib/pick-ban/types.js';
import { db } from '$lib/server/db';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';
import { hiddenMatchFilter } from '$lib/server/db/hidden';

export const load = async ({ locals }) => {
	const rooms = await db.query.room.findMany({
		columns: {
			id: true,
			status: true
		},
		with: {
			match: fullMatchQueryWithContext
		},
		where: {
			match: hiddenMatchFilter(locals.user),
			status: {
				in: [RoomStatus.OPEN, RoomStatus.IN_PROGRESS]
			}
		}
	});

	return {
		rooms
	};
};
