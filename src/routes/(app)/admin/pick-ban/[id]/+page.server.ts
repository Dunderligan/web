import type { MatchScope } from '$lib/pick-ban/config.js';
import { db } from '$lib/server/db';
import { nestedBracketQuery, nestedDivisionQuery } from '$lib/server/db/helpers.js';
import pickBanService from '$lib/server/pick-ban.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const config = await db.query.pickBanConfig.findFirst({
		where: {
			id: params.id
		},
		with: {
			bracket: nestedBracketQuery,
			division: nestedDivisionQuery
		}
	});

	if (!config) {
		throw error(404, 'Pick-ban config not found');
	}

	const scope: MatchScope = {
		bracketId: config.bracketId,
		divisionId: config.divisionId,
		round: config.round
	};

	const [applicableConfigs, maps, gamemodes] = await Promise.all([
		pickBanService.retrieveConfigs(scope),
		db.query.map.findMany(),
		db.query.gamemode.findMany()
	]);

	const parentConfigs = applicableConfigs.filter((c) => c.id !== config.id);

	return {
		config,
		parentConfigs,
		scope,
		maps,
		gamemodes
	};
};
