import { RoomStatus } from '$lib/pick-ban/types.js';
import { db } from '$lib/server/db';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';
import { hiddenMatchFilter } from '$lib/server/db/hidden';

const PAGE_SIZE = 10;

export const load = async ({ locals, url }) => {
	const page = parseInt(url.searchParams.get('page') ?? '1', 10);

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
				in: [RoomStatus.FINISHED, RoomStatus.CANCELLED]
			}
		},
		orderBy: {
			closedAt: 'desc'
		},
		limit: PAGE_SIZE,
		offset: (page - 1) * PAGE_SIZE
	});

	return {
		rooms,
		page
	};
};
