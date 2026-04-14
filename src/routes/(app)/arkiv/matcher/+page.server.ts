import { queryMatches } from '$lib/remote/match.remote.js';
import { db } from '$lib/server/db';
import { entityQuery, nestedGroupQuery } from '$lib/server/db/helpers.js';
import { parseMatchQueryParams } from '$lib/util';

export const load = async ({ url }) => {
	const params = parseMatchQueryParams(url.searchParams);
	params.pageSize = params.pageSize ?? 10;

	const roster = params.rosterId ? await fetchRoster(params.rosterId) : null;
	const division = params.divisionId ? await fetchDivision(params.divisionId) : null;

	const query = queryMatches(params);

	return { query, params, roster, division };
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
