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
type ExtraNodeInfo = {
	wonAgainst: Set<string>;
	lostAgainst: Set<string>;
	drawedAgainst: Set<string>;
	opponentMapRecordSum: number;
	resigned: boolean;
};

type TableScoreWithInfo = TableScore & ExtraNodeInfo;

type RosterTableScoreWithInfo = [string, TableScoreWithInfo];

type RosterGraph = Map<string, TableScore & ExtraNodeInfo>;

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
	const graph = new Map<string, TableScoreWithInfo>();

	for (const roster of rosters) {
		graph.set(roster.id, {
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

		const teamA = graph.get(match.rosterAId);
		const teamB = graph.get(match.rosterBId);

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

	for (const [_, score] of graph) {
		score.opponentMapRecordSum = sumOpponentMapRecord(score, graph);
	}

	// sort them lowest to highest seed according to the main tiebreakers
	const sortedScores = [...graph].sort((a, b) =>
		compareSeedFirstIteration(a, b, graph, legacyMode)
	);

	// if there's still ties, sort the tied teams according to secondary tiebreakers
	// we need to do this in two steps because these tiebreakers depend on the (preliminary) seeding of other teams
	sortedScores.sort((a, b) => compareSeedSecondIteration(a, b, sortedScores, graph, legacyMode));

	// filter our extra info out of the result
	const result = sortedScores.map(
		([
			rosterId,
			{ wonAgainst, lostAgainst, drawedAgainst, opponentMapRecordSum, resigned, ...score }
		]) => ({
			rosterId,
			score
		})
	);

	// return with the highest seeded team first (descending seed)
	return result.reverse();
}

/** Decides whether a should be seeded higher than b. */
function compareSeedFirstIteration(
	[aId, aScore]: RosterTableScoreWithInfo,
	[bId, bScore]: RosterTableScoreWithInfo,
	graph: RosterGraph,
	legacyMode: boolean
): number {
	// resigned teams are always seeded lower
	if (aScore.resigned && !bScore.resigned) return -1;
	if (!aScore.resigned && bScore.resigned) return 1;

	if (legacyMode) {
		return (
			aScore.mapWins - bScore.mapWins || // most map wins
			bScore.mapLosses - aScore.mapLosses || // least map losses
			aScore.wonAgainst.size - bScore.wonAgainst.size // most match wins
		);
	} else {
		const headToHead = compare(hasBeat(aId, bId, graph), hasBeat(bId, aId, graph));

		return (
			aScore.mapWins - bScore.mapWins || // most map wins
			aScore.wonAgainst.size - bScore.wonAgainst.size || // most match wins
			aScore.mapDraws - bScore.mapDraws || // most map draws
			headToHead || // head-to-head result
			aScore.opponentMapRecordSum - bScore.opponentMapRecordSum // highest sum of map record (map wins - losses) from fought opponents
		);
	}
}

function compareSeedSecondIteration(
	a: RosterTableScoreWithInfo,
	b: RosterTableScoreWithInfo,
	sortedScores: RosterTableScoreWithInfo[],
	graph: RosterGraph,
	legacyMode: boolean
): number {
	const firstIter = compareSeedFirstIteration(a, b, graph, legacyMode);
	if (firstIter !== 0) {
		return firstIter;
	}

	const [highestBeatenA, lowestLostToA] = highestAndLowestLostTo(a[1], sortedScores);
	const [highestBeatenB, lowestLostToB] = highestAndLowestLostTo(b[1], sortedScores);

	// keep in mind that a higher seed has a lower index in the sorted array
	return (
		compareNullable(highestBeatenB, highestBeatenA) || compareNullable(lowestLostToA, lowestLostToB)
	);
}

function sumOpponentMapRecord(score: TableScoreWithInfo, graph: RosterGraph): number {
	const playedAgainst = [...score.wonAgainst, ...score.lostAgainst, ...score.drawedAgainst];
	let sum = 0;

	for (const opponentId of playedAgainst) {
		const opponentScore = graph.get(opponentId);
		if (!opponentScore) continue;

		sum += opponentScore.mapWins - opponentScore.mapLosses;
	}

	return sum;
}

/** Returns whether a beat b, directly or indirectly (for example, if team a beat c who in turn beat b) using a breadth-first search. */
function hasBeat(aId: string, bId: string, graph: RosterGraph): boolean {
	const queue = [aId];
	const visited = new Set<string>(aId);

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current === bId) {
			return true; // a beat b
		}

		const currentScore = graph.get(current);
		if (!currentScore) continue;

		for (const opponentId of currentScore.wonAgainst) {
			if (!visited.has(opponentId)) {
				visited.add(current);
				queue.push(opponentId);
			}
		}
	}

	return false;
}

function compareNullable<T>(
	a: T | null,
	b: T | null,
	cmp: (a: T, b: T) => number = compare
): number {
	if (a === null && b === null) return 0;
	if (a === null) return -1;
	if (b === null) return 1;
	return cmp(a, b);
}

function compare(a: any, b: any): number {
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
