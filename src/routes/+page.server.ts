import { db } from '$lib/server/db';
import { fullMatchQueryWithContext } from '$lib/server/db/helpers';
import { hiddenMatchFilter } from '$lib/server/db/hidden.js';
import type { User } from '$lib/server/db/schema/auth';
import { fetchTournamentState } from '$lib/server/db/tournamentState.js';
import { MatchState, type TournamentState, type BracketWinner } from '$lib/types';

async function fetchMatches({
	filter,
	user,
	limit
}: {
	filter: any;
	user: User | null;
	limit?: number;
}) {
	return await db.query.match.findMany({
		limit,
		where: {
			...filter,
			...hiddenMatchFilter(user)
		},
		...fullMatchQueryWithContext
	});
}

export const load = async ({ locals }) => {
	const [upcoming, latest, tournamentState] = await Promise.all([
		fetchMatches({
			limit: 5,
			user: locals.user,
			filter: { state: MatchState.SCHEDULED, scheduledAt: { isNotNull: true } }
		}),
		fetchMatches({
			limit: 5,
			user: locals.user,
			filter: { state: MatchState.PLAYED }
		}),
		fetchTournamentState()
	]);

	return {
		tournamentState,
		matches: {
			upcoming,
			latest
		}
	};
};
