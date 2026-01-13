import { db } from '$lib/server/db';
import {
	groupMatchOrder,
	matchRosterQuery,
	nestedBracketQuery,
	nestedDivisionQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';
import { MatchState } from '$lib/types';

const getMatches = async ({ state }: { state: MatchState }) => {
	return await db.query.match.findMany({
		limit: 4,
		orderBy: groupMatchOrder,
		where: {
			state,
			rosterAId: {
				isNotNull: true
			},
			rosterBId: {
				isNotNull: true
			}
		},
		columns: {
			id: true,
			teamAScore: true,
			teamBScore: true,
			draws: true,
			state: true,
			playedAt: true,
			scheduledAt: true,
			vodUrl: true
		},
		with: {
			group: nestedGroupQuery,
			bracket: nestedBracketQuery,
			rosterA: matchRosterQuery,
			rosterB: matchRosterQuery
		}
	});
};

export const load = async () => {
	const [upcoming, latest] = await Promise.all([
		getMatches({ state: MatchState.SCHEDULED }),
		getMatches({ state: MatchState.PLAYED })
	]);

	return {
		matches: {
			upcoming,
			latest
		}
	};
};
