import { getRequestEvent } from '$app/server';
import { matchRoster, matchWinner } from '$lib/match';
import { db } from '$lib/server/db';
import {
	entityQuery,
	finalMatchQuery,
	fullMatchQueryWithContext,
	hiddenSeasonFilter
} from '$lib/server/db/helpers';
import { MatchState, type TournamentState, type Winner } from '$lib/types';

async function fetchMatches(state: MatchState) {
	return await db.query.match.findMany({
		limit: 4,
		where: {
			state,
			rosterAId: {
				isNotNull: true
			},
			rosterBId: {
				isNotNull: true
			}
		},
		...fullMatchQueryWithContext
	});
}

async function fetchTournamentState(): Promise<TournamentState | null> {
	const { locals } = getRequestEvent();

	const data = await db.query.season.findFirst({
		orderBy: {
			startedAt: 'desc'
		},
		columns: {
			startedAt: true,
			endedAt: true,
			...entityQuery.columns
		},
		with: {
			registration: {
				columns: {
					openDate: true,
					closeDate: true,
					url: true
				}
			},
			divisions: {
				...entityQuery,
				with: {
					brackets: {
						columns: {
							name: true
						},
						with: {
							matches: finalMatchQuery
						}
					}
				}
			}
		}
	});

	if (!data) {
		return null;
	}

	const { divisions, registration, ...season } = data;

	const now = new Date();

	const seasonEnded = season.endedAt && season.endedAt <= now;
	const seasonStarted = season.startedAt && season.startedAt <= now;

	if (seasonEnded || (!seasonStarted && !registration)) {
		// offseason if season is over, or there is no registration for upcoming season

		const winners = divisions
			.flatMap((div) =>
				div.brackets.flatMap(({ matches, ...bracket }) =>
					matches.map((final) => {
						const winner = matchWinner(final);

						return winner
							? {
									roster: matchRoster(final, winner),
									bracket
								}
							: null;
					})
				)
			)
			.filter((match) => match != null);

		return {
			season,
			status: 'offseason',
			winners: winners as Winner[]
		};
	}

	if (seasonStarted) {
		// ongoing season
		return {
			season,
			status: 'ongoing'
		};
	}

	const registrationOpen = registration?.openDate && registration.openDate <= now;
	const registrationClosed = registration?.closeDate && registration.closeDate <= now;

	if (registrationOpen && !registrationClosed) {
		return {
			season,
			status: 'registration',
			registrationClosesAt: registration.closeDate
		};
	}

	if (registrationClosed || !registration) {
		return {
			season,
			status: 'starting'
		};
	}

	return {
		season,
		status: 'upcoming',
		registrationOpensAt: registration!.openDate
	};
}

export const load = async () => {
	const [upcoming, latest, tournamentState] = await Promise.all([
		fetchMatches(MatchState.SCHEDULED),
		fetchMatches(MatchState.PLAYED),
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
