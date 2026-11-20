import type { MatchScope } from '$lib/pick-ban/config.js';
import { db } from '$lib/server/db';
import pickBanService from '$lib/server/pick-ban.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const scope: MatchScope = {
		bracketId: null,
		divisionId: params.division,
		round: null
	};

	const [configs, division] = await Promise.all([
		pickBanService.retrieveConfigs(scope),
		db.query.division.findFirst({
			where: {
				id: params.division
			},
			with: {
				season: true
			}
		})
	]);

	if (!division) {
		throw error(404, 'Division not found');
	}

	return {
		configs,
		division
	};
};
