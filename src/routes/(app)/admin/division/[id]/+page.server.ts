import { db } from '#lib/server/db.ts';
import { divisionOrder } from '#lib/server/db/helpers.ts';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const data = await db.query.division.findFirst({
		where: {
			id: params.id
		},
		with: {
			groups: {
				orderBy: { name: 'asc' }
			},
			season: true,
			brackets: {
				orderBy: (t) => divisionOrder(t.name)
			},
			pickBanConfigs: {
				columns: {
					id: true,
					round: true
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	return { division: data };
};
