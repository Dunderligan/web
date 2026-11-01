import { queryMatches } from '$lib/remote/match.remote.js';
import { fetchTournamentState } from '$lib/server/db/tournament-state.js';
import { MatchState } from '$lib/types';

export const load = async () => {
	const [upcoming, latest, tournamentState] = await Promise.all([
		queryMatches({
			pageSize: 5,
			state: [MatchState.SCHEDULED],
			hasDate: true
		}),
		queryMatches({
			pageSize: 5,
			state: [MatchState.PLAYED],
			hasDate: true
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
