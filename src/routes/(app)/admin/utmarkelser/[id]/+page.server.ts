import { db } from '$lib/server/db';
import { entityQuery, nestedDivisionQuery } from '$lib/server/db/helpers.js';
import { hiddenDivisionFilter, hiddenSeasonFilter } from '$lib/server/db/hidden';
import type { User } from '$lib/server/db/schema/auth.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals, depends }) => {
	depends('admin:awards');

	const [awardType, seasons] = await Promise.all([
		getAwardType(params.id, locals.user),
		db.query.season.findMany({
			where: {
				hidden: hiddenSeasonFilter(locals.user)
			},
			with: {
				divisions: entityQuery
			}
		})
	]);

	if (!awardType) {
		throw error(404);
	}

	return {
		awardType,
		seasons
	};
};

async function getAwardType(id: string, user: User | null) {
	return await db.query.awardType.findFirst({
		where: {
			id
		},
		with: {
			awards: {
				where: {
					OR: [
						{
							divisionId: {
								isNull: true
							}
						},
						{
							division: hiddenDivisionFilter(user)
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
					division: nestedDivisionQuery
				}
			}
		}
	});
}
