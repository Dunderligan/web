import { matchRoster, matchWinner, resolvedMatchToLogical } from '$lib/match';
import type { TournamentState, BracketWinner, ResolvedMatch, NestedBracket } from '$lib/types';
import { db } from '../db';
import { divisionOrder, entityQuery, finalMatchQuery, nestedDivisionQuery } from './helpers';

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
			winners
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
	brackets: (NestedBracket & { matches: ResolvedMatch[] })[]
): BracketWinner[] {
	return brackets
		.flatMap(({ matches: finalMatches, ...bracket }) =>
			finalMatches.map((finalMatch) => {
				const winner = matchWinner(resolvedMatchToLogical(finalMatch));

				if (!winner) {
					return null;
				}

				return {
					roster: matchRoster(finalMatch, winner)!,
					bracket
				};
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
							id: true,
							name: true
						},
						with: {
							division: nestedDivisionQuery,
							matches: finalMatchQuery
						}
					}
				}
			}
		}
	});
}
