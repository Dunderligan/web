import { matchRoster, matchWinner } from '$lib/match';
import { db } from '$lib/server/db';
import { divisionOrder, entityQuery, finalMatchQuery, fullMatchQueryWithContext, hiddenMatchFilter } from '$lib/server/db/helpers';
import type { User } from '$lib/server/db/schema/auth';
import { MatchState, type TournamentState, type Winner } from '$lib/types';

async function fetchMatches(state: MatchState, user: User | null) {
	return await db.query.match.findMany({
		limit: 4,
		where: {
			state,
			rosterAId: {
				isNotNull: true
			},
			rosterBId: {
				isNotNull: true
			},
			...hiddenMatchFilter(user)
		},
		...fullMatchQueryWithContext
	});
}

async function fetchTournamentState(): Promise<TournamentState | null> {
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
				orderBy: (t) => divisionOrder(t.name),
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

export const load = async ({ locals }) => {
	const [upcoming, latest, tournamentState] = await Promise.all([
		fetchMatches(MatchState.SCHEDULED, locals.user),
		fetchMatches(MatchState.PLAYED, locals.user),
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
