import { matchRoster, matchWinner } from '$lib/match';
import type { TournamentState, BracketWinner, MatchState, ResolvedMatch } from '$lib/types';
import { db } from '../db';
import { divisionOrder, entityQuery, finalMatchQuery } from './helpers';

export async function fetchTournamentState(): Promise<TournamentState | null> {
	const data = await queryLatestSeason();

	if (!data) {
		return null;
	}

	const { divisions, registration, ...season } = data;

	const now = new Date();

	const seasonEnded = season.endedAt && season.endedAt <= now;
	const seasonStarted = season.startedAt && season.startedAt <= now;

	if (seasonEnded) {
		const brackets = divisions.flatMap((division) => division.brackets);
		const winners = aggregateWinners(brackets);

		return {
			season,
			status: 'offseason',
			winners: winners as BracketWinner[]
		};
	}

	if (seasonStarted) {
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
			status: 'starting',
			startsAt: season.startedAt
		};
	}

	return {
		season,
		status: 'upcoming',
		registrationOpensAt: registration!.openDate
	};
}

function aggregateWinners(
	brackets: {
		name: string;
		matches: ResolvedMatch[];
	}[]
) {
	return brackets
		.flatMap(({ matches, ...bracket }) =>
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
		.filter((match) => match != null);
}

async function queryLatestSeason() {
	return await db.query.season.findFirst({
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
}
