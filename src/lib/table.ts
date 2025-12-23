import type { LogicalMatch } from './types';

export type TableScore = {
	mapWins: number;
	mapLosses: number;
	mapDraws: number;
	matchesPlayed: number;
};

type ExtraTableInfo = {
	wonAgainst: Set<string>;
	lostAgainst: Set<string>;
};

export function calculateStandings<R extends { id: string }>(
	rosters: R[],
	matches: LogicalMatch[]
): {
	rosterId: string;
	score: TableScore;
}[] {
	const rosterScores = new Map<string, TableScore & ExtraTableInfo>();

	for (const roster of rosters) {
		rosterScores.set(roster.id, {
			mapWins: 0,
			mapLosses: 0,
			mapDraws: 0,
			matchesPlayed: 0,
			wonAgainst: new Set(),
			lostAgainst: new Set()
		});
	}

	for (const match of matches) {
		if (!match.played || !match.rosterAId || !match.rosterBId) continue;

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

	// sort them highest to lowest seed
	const sortedScores = [...rosterScores].sort((a, b) => compareSeed(a[1], b[1]));

	// if there's still ties, break them by:
	// - whoever won a match against the higher seeded opponent
	// - whoever lost a match against the lower seeded opponent
	for (let i = 0; i < sortedScores.length - 1; i++) {
		// iterate by pairs, from top to bottom
		const [_rosterAId, rosterAScore] = sortedScores[i];
		const [_rosterBId, rosterBScore] = sortedScores[i + 1];

		if (compareSeed(rosterAScore, rosterBScore) !== 0) {
			continue;
		}

		// a lower number here means a higher seed
		const [highestBeatenA, lowestLostToA] = highestAndLowestLostTo(rosterAScore, sortedScores);
		const [highestBeatenB, lowestLostToB] = highestAndLowestLostTo(rosterBScore, sortedScores);

		const aShouldBeHigher =
			(highestBeatenA !== null && highestBeatenB !== null && highestBeatenB - highestBeatenA) ||
			(lowestLostToA !== null && lowestLostToB !== null && lowestLostToA - lowestLostToB) ||
			0;

		if (aShouldBeHigher > 0) {
			// already correct
		} else if (aShouldBeHigher < 0) {
			// swap
			[sortedScores[i], sortedScores[i + 1]] = [sortedScores[i + 1], sortedScores[i]];
		}
	}

	// filter out our extra info
	const result = sortedScores.map(([rosterId, { wonAgainst, lostAgainst, ...score }]) => ({
		rosterId,
		score
	}));

	return result;
}

/** Decides whether a should be seeded higher than b. */
function compareSeed(a: TableScore & ExtraTableInfo, b: TableScore & ExtraTableInfo): number {
	// tiebreakers in order:
	// - most map wins
	// - least map losses
	// - most matches won

	return (
		b.mapWins - a.mapWins || a.mapLosses - b.mapLosses || b.wonAgainst.size - a.wonAgainst.size
	);
}

function highestAndLowestLostTo(
	score: TableScore & ExtraTableInfo,
	sortedScores: [string, TableScore & ExtraTableInfo][]
) {
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

export function sortBySeed<R extends { id: string }>(rosters: R[], matches: LogicalMatch[]) {
	const seeds = new Map(
		calculateStandings(rosters, matches).map((row, seed) => [row.rosterId, seed])
	);

	rosters.sort((a, b) => seeds.get(a.id)! - seeds.get(b.id)!);
}
