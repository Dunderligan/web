import { db } from '$lib/server/db';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';
import { hiddenMatchFilter } from '$lib/server/db/hidden.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const room = await db.query.room.findFirst({
		where: {
			id: params.id,
			match: hiddenMatchFilter(locals.user)
		},
		with: {
			match: fullMatchQueryWithContext,
			maps: {
				orderBy: {
					mapIndex: 'asc'
				},
				with: {
					decisions: true
				}
			}
		}
	});

	if (!room) {
		throw error(404, 'Room not found.');
	}

	return {
		room
	};
};
