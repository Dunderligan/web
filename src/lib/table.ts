import { hasMatchScore } from './match';
import { type LogicalMatch } from './types';

/**
 * The score of a team in the standings table.
 */
export type TableScore = {
	mapWins: number;
	mapLosses: number;
	mapDraws: number;
	matchesPlayed: number;
};

/**
 * Additional per-team data used during the calculation of standings (particularly tiebreakers).
 */
type ExtraTableInfo = {
	wonAgainst: Set<string>;
	lostAgainst: Set<string>;
	drawedAgainst: Set<string>;
	opponentMapRecordSum: number;
	resigned: boolean;
};

type TableScoreWithInfo = TableScore & ExtraTableInfo;

type RosterTableScoreWithInfo = [string, TableScoreWithInfo];

type RosterScoreMap = Map<string, TableScore & ExtraTableInfo>;

/**
 * Calculates scores and standings for a list of rosters, according to the scores of the given matches
 * and the tournament's (current) tiebreakers.
 *
 * The result is sorted from highest to lowest seed (as usually displayed in a table).
 * Resigned rosters are placed at the bottom of the table (that is last in the result).
 */
export function calculateStandings<R extends { id: string; resigned?: boolean }>(
	rosters: R[],
	matches: LogicalMatch[],
	legacyMode: boolean
): {
	rosterId: string;
	score: TableScore;
}[] {
	const rosterScores = new Map<string, TableScoreWithInfo>();

	for (const roster of rosters) {
		rosterScores.set(roster.id, {
			mapWins: 0,
			mapLosses: 0,
			mapDraws: 0,
			matchesPlayed: 0,
			wonAgainst: new Set(),
			lostAgainst: new Set(),
			drawedAgainst: new Set(),
			opponentMapRecordSum: 0,
			resigned: roster.resigned ?? false
		});
	}

	for (const match of matches) {
		if (!hasMatchScore(match) || !match.rosterAId || !match.rosterBId) continue;

		const teamA = rosterScores.get(match.rosterAId);
		const teamB = rosterScores.get(match.rosterBId);

		if (!teamA || !teamB) {
			continue;
		}

		let teamAScore = match.teamAScore ?? 0;
		let teamBScore = match.teamBScore ?? 0;
		let draws = match.draws ?? 0;

		if (teamAScore > teamBScore) {
			teamA.wonAgainst.add(match.rosterBId);
			teamB.lostAgainst.add(match.rosterAId);
		} else if (teamBScore > teamAScore) {
			teamB.wonAgainst.add(match.rosterAId);
			teamA.lostAgainst.add(match.rosterBId);
		} else {
			teamA.drawedAgainst.add(match.rosterBId);
			teamB.drawedAgainst.add(match.rosterAId);
		}

		teamA.mapWins += teamAScore;
		teamA.mapLosses += teamBScore;
		teamA.mapDraws += draws;

		teamB.mapWins += teamBScore;
		teamB.mapLosses += teamAScore;
		teamB.mapDraws += draws;

		teamA.matchesPlayed += 1;
		teamB.matchesPlayed += 1;
	}

	for (const [_, score] of rosterScores) {
		score.opponentMapRecordSum = sumOpponentMapRecord(score, rosterScores);
	}

	// sort them lowest to highest seed according to the main tiebreakers
	const sortedScores = [...rosterScores].sort((a, b) =>
		compareSeedFirstIteration(a, b, legacyMode)
	);

	// if there's still ties, sort the tied teams according to secondary tiebreakers
	// we need to do this in two steps because these tiebreakers depend on the (preliminary) seeding of other teams
	sortedScores.sort((a, b) => compareSeedSecondIteration(a, b, sortedScores, legacyMode));

	// filter our extra info out of the result
	const result = sortedScores.map(([rosterId, { wonAgainst, lostAgainst, ...score }]) => ({
		rosterId,
		score
	}));

	// return with the highest seeded team first (descending seed)
	return result.reverse();
}

/** Decides whether a should be seeded higher than b. */
function compareSeedFirstIteration(
	[_, aScore]: RosterTableScoreWithInfo,
	[bId, bScore]: RosterTableScoreWithInfo,
	legacyMode: boolean
): number {
	// resigned teams are always seeded lower
	if (aScore.resigned && !bScore.resigned) return -1;
	if (!aScore.resigned && bScore.resigned) return 1;

	if (legacyMode) {
		const headToHead = aScore.wonAgainst.has(bId) ? 1 : aScore.lostAgainst.has(bId) ? -1 : 0;

		return (
			aScore.mapWins - bScore.mapWins || // most map wins
			aScore.mapDraws - bScore.mapDraws || // most map draws
			headToHead || // head-to-head result (if they played each other)
			aScore.opponentMapRecordSum - bScore.opponentMapRecordSum // highest sum of map record (map wins - losses) from fought opponents
		);
	} else {
		return (
			aScore.mapWins - bScore.mapWins || // most map wins
			bScore.mapLosses - aScore.mapLosses || // least map losses
			aScore.wonAgainst.size - bScore.wonAgainst.size // most match wins
		);
	}
}

function compareSeedSecondIteration(
	a: RosterTableScoreWithInfo,
	b: RosterTableScoreWithInfo,
	sortedScores: RosterTableScoreWithInfo[],
	legacyMode = false
): number {
	const firstIterationResult = compareSeedFirstIteration(a, b, legacyMode);
	if (firstIterationResult !== 0) {
		return firstIterationResult;
	}

	const [highestBeatenA, lowestLostToA] = highestAndLowestLostTo(a[1], sortedScores);
	const [highestBeatenB, lowestLostToB] = highestAndLowestLostTo(b[1], sortedScores);

	// keep in mind that a higher seed has a lower index in the sorted array
	return (
		compareNullable(highestBeatenB, highestBeatenA) || compareNullable(lowestLostToA, lowestLostToB)
	);
}

function sumOpponentMapRecord(score: TableScoreWithInfo, rosterScores: RosterScoreMap): number {
	const playedAgainst = [...score.wonAgainst, ...score.lostAgainst, ...score.drawedAgainst];
	let sum = 0;

	for (const opponentId of playedAgainst) {
		const opponentScore = rosterScores.get(opponentId);
		if (!opponentScore) continue;

		sum += opponentScore.mapWins - opponentScore.mapLosses;
	}

	return sum;
}

function compareNullable<T>(
	a: T | null,
	b: T | null,
	cmp: (a: T, b: T) => number = defaultCompare
): number {
	if (a === null && b === null) return 0;
	if (a === null) return -1;
	if (b === null) return 1;
	return cmp(a, b);
}

function defaultCompare(a: any, b: any): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

/** Returns the indicies of the highest beaten and lowest lost to opponents of a roster. */
function highestAndLowestLostTo(
	score: TableScoreWithInfo,
	sortedScores: RosterTableScoreWithInfo[]
): [number | null, number | null] {
	let highestBeaten: number | null = null;
	let lowestLostTo: number | null = null;

	for (let i = 0; i < sortedScores.length; i++) {
		const [rosterId, _] = sortedScores[i];

		if (score.wonAgainst.has(rosterId) && highestBeaten === null) {
			highestBeaten = i;
		}
		if (score.lostAgainst.has(rosterId)) {
			lowestLostTo = i;
		}
	}

	return [highestBeaten, lowestLostTo];
}

/** Sorts rosters in-place according to their seed, as calculated by the calculateStandings function. */
export function sortBySeed<R extends { id: string }>(
	rosters: R[],
	matches: LogicalMatch[],
	legacyMode: boolean
) {
	const seeds = new Map(
		calculateStandings(rosters, matches, legacyMode).map((row, seed) => [row.rosterId, seed])
	);

	rosters.sort((a, b) => seeds.get(a.id)! - seeds.get(b.id)!);
}
