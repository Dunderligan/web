import { db } from '$lib/server/db';
import {
	groupMatchOrder,
	matchRosterQuery,
	nestedBracketQuery,
	nestedDivisionQuery,
	nestedGroupQuery
} from '$lib/server/db/helpers';

const getMatches = async ({ played }: { played: boolean }) => {
	return await db.query.match.findMany({
		limit: 3,
		orderBy: groupMatchOrder,
		where: {
			played,
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
			played: true,
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
		getMatches({ played: false }),
		getMatches({ played: true })
	]);

	return {
		matches: {
			upcoming,
			latest
		}
	};
};
