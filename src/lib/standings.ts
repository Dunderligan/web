import { hasMatchScore } from './match';
import { type LogicalMatch } from './types';
import { compare, compareNullable } from './util';

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
type CompetitionRecord = {
	wonAgainst: Set<string>;
	lostAgainst: Set<string>;
	drawedAgainst: Set<string>;
	opponentMapRecordSum: number;
	resigned: boolean;
};

type TableScoreWithRecord = {
	score: TableScore;
	record: CompetitionRecord;
};

type RosterTableScoreWithRecord = [string, TableScoreWithRecord];

type RosterMap = Map<string, TableScoreWithRecord>;

type RosterInfo = { id: string; resigned: boolean };

/** Sorts rosters in-place according to their seed, as calculated by the calculateStandings function. */
export function sortBySeed(rosters: RosterInfo[], matches: LogicalMatch[], legacyMode: boolean) {
	const seeds = new Map(
		calculateStandings(rosters, matches, legacyMode).map((row, seed) => [row.rosterId, seed])
	);

	rosters.sort((a, b) => seeds.get(a.id)! - seeds.get(b.id)!);
}

/**
 * Calculates scores and standings for a list of rosters, according to the scores of the given matches
 * and the tournament's (current) tiebreakers.
 *
 * The result is sorted from highest to lowest seed (as usually displayed in a table).
 * Resigned rosters are placed at the bottom of the table (that is last in the result).
 */
export function calculateStandings(
	rosters: RosterInfo[],
	matches: LogicalMatch[],
	legacyMode: boolean
): {
	rosterId: string;
	score: TableScore;
}[] {
	const map = createRosterMap(rosters);

	computeMatchResults(matches, map);

	for (const roster of map.values()) {
		roster.record.opponentMapRecordSum = sumOpponentMapRecord(roster, map);
	}

	// sort them lowest to highest seed according to the main tiebreakers
	const sortedScores = [...map].sort((a, b) => compareSeedFirstIteration(a, b, map, legacyMode));

	// if there's still ties, sort the tied teams according to secondary tiebreakers
	// we need to do this in two steps because these tiebreakers depend on the (preliminary) seeding of other teams
	sortedScores.sort((a, b) => compareSeedSecondIteration(a, b, sortedScores, map, legacyMode));

	// filter our extra info out of the result
	const result = sortedScores.map(([rosterId, { score }]) => ({
		rosterId,
		score
	}));

	// return with the highest seeded team first (descending seed)
	return result.reverse();
}

function createRosterMap(rosters: RosterInfo[]): RosterMap {
	const map = new Map<string, TableScoreWithRecord>();

	for (const roster of rosters) {
		map.set(roster.id, {
			score: {
				mapWins: 0,
				mapLosses: 0,
				mapDraws: 0,
				matchesPlayed: 0
			},
			record: {
				wonAgainst: new Set(),
				lostAgainst: new Set(),
				drawedAgainst: new Set(),
				opponentMapRecordSum: 0,
				resigned: roster.resigned
			}
		});
	}

	return map;
}

function computeMatchResults(matches: LogicalMatch[], graph: Map<string, TableScoreWithRecord>) {
	for (const match of matches) {
		if (!hasMatchScore(match) || !match.rosterAId || !match.rosterBId) continue;

		const teamA = graph.get(match.rosterAId);
		const teamB = graph.get(match.rosterBId);

		if (!teamA || !teamB) {
			continue;
		}

		const teamAScore = match.teamAScore ?? 0;
		const teamBScore = match.teamBScore ?? 0;
		const draws = match.draws ?? 0;

		if (teamAScore > teamBScore) {
			teamA.record.wonAgainst.add(match.rosterBId);
			teamB.record.lostAgainst.add(match.rosterAId);
		} else if (teamBScore > teamAScore) {
			teamB.record.wonAgainst.add(match.rosterAId);
			teamA.record.lostAgainst.add(match.rosterBId);
		} else {
			teamA.record.drawedAgainst.add(match.rosterBId);
			teamB.record.drawedAgainst.add(match.rosterAId);
		}

		teamA.score.mapWins += teamAScore;
		teamA.score.mapLosses += teamBScore;
		teamA.score.mapDraws += draws;

		teamB.score.mapWins += teamBScore;
		teamB.score.mapLosses += teamAScore;
		teamB.score.mapDraws += draws;

		teamA.score.matchesPlayed += 1;
		teamB.score.matchesPlayed += 1;
	}
}

/** Decides whether a should be seeded higher than b. */
function compareSeedFirstIteration(
	[aId, a]: RosterTableScoreWithRecord,
	[bId, b]: RosterTableScoreWithRecord,
	graph: RosterMap,
	legacyMode: boolean
): number {
	// resigned teams are always seeded lower
	if (a.record.resigned && !b.record.resigned) return -1;
	if (!a.record.resigned && b.record.resigned) return 1;

	if (legacyMode) {
		return (
			a.score.mapWins - b.score.mapWins || // most map wins
			b.score.mapLosses - a.score.mapLosses || // least map losses
			a.record.wonAgainst.size - b.record.wonAgainst.size // most match wins
		);
	} else {
		const headToHead = compare(hasBeat(aId, bId, graph), hasBeat(bId, aId, graph));

		return (
			a.score.mapWins - b.score.mapWins || // most map wins
			a.record.wonAgainst.size - b.record.wonAgainst.size || // most match wins
			a.score.mapDraws - b.score.mapDraws || // most map draws
			headToHead || // head-to-head result
			a.record.opponentMapRecordSum - b.record.opponentMapRecordSum // highest sum of map record (map wins - losses) from fought opponents
		);
	}
}

function compareSeedSecondIteration(
	a: RosterTableScoreWithRecord,
	b: RosterTableScoreWithRecord,
	sortedScores: RosterTableScoreWithRecord[],
	graph: RosterMap,
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

function sumOpponentMapRecord(score: TableScoreWithRecord, map: RosterMap): number {
	const playedAgainst = [
		...score.record.wonAgainst,
		...score.record.lostAgainst,
		...score.record.drawedAgainst
	];
	let sum = 0;

	for (const opponentId of playedAgainst) {
		const opponentScore = map.get(opponentId);
		if (!opponentScore) continue;

		sum += opponentScore.score.mapWins - opponentScore.score.mapLosses;
	}

	return sum;
}

/** Returns whether a beat b, directly or indirectly (for example, if team a beat c who in turn beat b) using a breadth-first search. */
function hasBeat(aId: string, bId: string, map: RosterMap): boolean {
	const queue = [aId];
	const visited = new Set<string>(aId);

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current === bId) {
			return true; // a beat b
		}

		const currentScore = map.get(current);
		if (!currentScore) continue;

		for (const opponentId of currentScore.record.wonAgainst) {
			if (!visited.has(opponentId)) {
				visited.add(current);
				queue.push(opponentId);
			}
		}
	}

	return false;
}

/** Returns the indicies of the highest beaten and lowest lost to opponents of a roster. */
function highestAndLowestLostTo(
	roster: TableScoreWithRecord,
	sortedScores: RosterTableScoreWithRecord[]
): [number | null, number | null] {
	let highestBeaten: number | null = null;
	let lowestLostTo: number | null = null;

	for (let i = 0; i < sortedScores.length; i++) {
		const [rosterId] = sortedScores[i];

		if (roster.record.wonAgainst.has(rosterId) && highestBeaten === null) {
			highestBeaten = i;
		}
		if (roster.record.lostAgainst.has(rosterId)) {
			lowestLostTo = i;
		}
	}

	return [highestBeaten, lowestLostTo];
}
