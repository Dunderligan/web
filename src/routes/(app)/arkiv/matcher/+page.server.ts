import { queryMatches } from '$lib/remote/match.remote.js';
import { db } from '$lib/server/db';
import { entityQuery, nestedGroupQuery } from '$lib/server/db/helpers.js';
import { MatchState } from '$lib/types.js';

export const load = async ({ url }) => {
	const stateParam = url.searchParams.get('status');

	const state = stateParam
		?.split(',')
		.filter((str) => Object.values(MatchState).includes(str as MatchState))
		.map((str) => str as MatchState);

	const params = {
		rosterId: url.searchParams.get('roster') ?? undefined,
		divisionId: url.searchParams.get('division') ?? undefined,
		page: Number(url.searchParams.get('sida') ?? 0),
		state
	};

	const roster = params.rosterId ? await fetchRoster(params.rosterId) : null;
	const division = params.divisionId ? await fetchDivision(params.divisionId) : null;

	const query = queryMatches(params);

	return { query, params, roster, division, pageSize: 10 };
};

async function fetchRoster(id: string) {
	return await db.query.roster.findFirst({
		where: { id },
		with: {
			group: nestedGroupQuery
		},
		...entityQuery
	});
}

async function fetchDivision(id: string) {
	return await db.query.division.findFirst({
		where: { id },
		with: {
			season: entityQuery
		},
		...entityQuery
	});
}
