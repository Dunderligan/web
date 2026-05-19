import { AuthRole, checkPermission } from '$lib/authRole';
import { db } from '$lib/server/db';
import { hiddenDivisionFilter } from '$lib/server/db/hidden';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals, depends }) => {
	depends('admin:award-type');

	if (!checkPermission(locals.user?.role, AuthRole.MODERATOR)) {
		throw error(403, 'Insufficient permissions');
	}

	const awardType = await db.query.awardType.findFirst({
		where: {
			id: params.id
		}
	});

	if (!awardType) {
		throw error(404);
	}

	const awards = await db.query.playerAward.findMany({
		where: {
			awardTypeId: params.id,
			OR: [
				{
					divisionId: {
						isNull: true as true
					}
				},
				{
					division: hiddenDivisionFilter(locals.user)
				}
			]
		},
		with: {
			player: {
				columns: {
					id: true,
					battletag: true
				}
			},
			division: {
				columns: {
					id: true,
					name: true,
					slug: true
				},
				with: {
					season: {
						columns: {
							id: true,
							name: true,
							slug: true,
							startedAt: true
						}
					}
				}
			}
		}
	});

	const divisions = await db.query.division.findMany({
		where: hiddenDivisionFilter(locals.user),
		columns: {
			id: true,
			name: true,
			slug: true
		},
		with: {
			season: {
				columns: {
					id: true,
					name: true,
					slug: true,
					startedAt: true
				}
			}
		}
	});

	return {
		awardType,
		awards,
		divisions
	};
};
