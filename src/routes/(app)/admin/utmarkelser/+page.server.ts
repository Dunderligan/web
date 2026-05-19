import { AuthRole, checkPermission } from '$lib/authRole';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!checkPermission(locals.user?.role, AuthRole.MODERATOR)) {
		throw error(403, 'Insufficient permissions');
	}

	const awardTypes = await db.query.awardType.findMany({
		orderBy: {
			name: 'asc'
		},
		with: {
			awards: {
				columns: {
					id: true
				}
			}
		}
	});

	return {
		awardTypes: awardTypes.map(({ awards, ...awardType }) => ({
			...awardType,
			awardCount: awards.length
		}))
	};
};
