import { v4 as uuidv4 } from 'uuid';
import type { FullMatch, LogicalMatch } from './types';
import { isMatchBetween } from './match';

export function minBracketRounds(teamCount: number): number {
	if (teamCount < 2) {
		return 0;
	}
	return Math.ceil(Math.log2(teamCount));
}

/**
 * Generates a bracket structure based on the seeds given by the order of the rosters array.
 *
 * If there are more rosters than slots in the bracket, the lowest seeded rosters are ignored.
 * If there are fewer rosters than slots, some rosters will get a bye in the first round.
 */
export function createBracket<R extends { id: string }, M extends LogicalMatch>(
	rosters: R[],
	matches: M[],
	roundCount: number,
	options: { avoidPreviousMatches?: boolean } = {
		avoidPreviousMatches: true
	}
): FullMatch[][] {
	const slots = Math.pow(2, roundCount);
	let emptySlots = slots - rosters.length;

	const rounds = [];
	let order = 0;

	// create the final match
	rounds.push([createMatch(order++)]);

	// create matches in reverse order
	for (let i = 1; i < roundCount; i++) {
		const round = [];

		for (const nextMatch of rounds[i - 1]) {
			const matchA = createMatch(order++, nextMatch.id);
			const matchB = createMatch(order++, nextMatch.id);

			round.push(matchA);
			round.push(matchB);
		}

		rounds.push(round);
	}

	// don't mutate the original rosters array
	rosters = [...rosters];

	if (rosters.length > slots) {
		// some teams don't proceed
		rosters = rosters.slice(0, slots);
	}

	// fill the first round according to seeding
	const matchOrder = getMatchOrder(roundCount);
	const firstRound = rounds[rounds.length - 1];

	for (const matchIndex of matchOrder) {
		if (rosters.length === 0) break;
		const match = firstRound[matchIndex];

		const rosterA = rosters.shift()!;
		match.rosterAId = rosterA.id;

		if (emptySlots > 0) {
			emptySlots--;

			// automatically advance this roster
			match.played = true;
			match.teamAScore = 3;

			const nextRound = rounds[rounds.length - 2];
			const nextMatch = nextRound[Math.floor(matchIndex / 2)];
			if (!nextMatch.rosterAId) {
				nextMatch.rosterAId = rosterA.id;
			} else {
				nextMatch.rosterBId = rosterA.id;
			}

			continue;
		}

		let found = false;

		// find the lowest seeded viable opponent
		for (let i = rosters.length - 1; i >= 0; i--) {
			const otherRoster = rosters[i];

			// if they have played each other in the group stage, skip
			if (
				options.avoidPreviousMatches &&
				matches.some((match) => isMatchBetween(match, rosterA.id, otherRoster.id))
			) {
				continue;
			}

			const [rosterB] = rosters.splice(i, 1);
			match.rosterBId = rosterB.id;
			found = true;
			break;
		}

		if (found) continue;

		// if no valid opponent found, fall back to the next in line
		const rosterB = rosters.shift();
		if (rosterB) {
			match.rosterBId = rosterB.id;
		} else {
			// this should never happen
			throw new Error('Not enough rosters to fill the bracket');
		}
	}

	return rounds.reverse();
}

/** Get the order of which matches in the first round of the bracket should be visited.
 * E.g. for 8 teams, the order is [0, 2, 3, 1]
 * This ensures that the highest seeded teams don't meet until the later rounds.
 */
function getMatchOrder(rounds: number): number[] {
	let round = [0];
	for (let i = 0; i < rounds - 1; i++) {
		round = nextRound(round);
	}

	// we now have an array of match order where each index represents which
	// order the match at that index should be visited

	// we need to convert it to an a array where the value is the match index,
	// and the index is the order

	// example for 8 teams (4 matches):

	// round = [0, 3, 1, 2]
	// - visit match 0 at #0, match 1 at #3, match 2 at #2, match 3 at #1
	// => to:
	// index order = [0, 2, 3, 1]
	// - visit match 0, then 2, 3, 1
	const visitOrder = round
		.map((matchIndex, visitIndex) => [matchIndex, visitIndex])
		.sort((a, b) => a[0] - b[0]) // sort by match index
		.map((a) => a[1]); // take the visit index

	return visitOrder;

	function nextRound(lastRound: number[]): number[] {
		const nextRound: number[] = [];
		const newLength = lastRound.length * 2 - 1;

		for (const item of lastRound) {
			nextRound.push(item);
			nextRound.push(newLength - item);
		}

		return nextRound;
	}
}

function createMatch(order: number, nextMatchId?: string): FullMatch {
	return {
		id: uuidv4(),
		nextMatchId,
		order,
		played: false,
		teamAScore: 0,
		teamBScore: 0,
		draws: 0
	};
}

/** Takes a flat array of matches and builds the bracket structure as an array of rounds. */
export function buildBracketRounds<T extends { id: string; nextMatchId?: string | null }>(
	matches: T[]
): T[][] {
	// the final match is the one without a nextMatchId
	const finalMatch = matches.find((match) => !match.nextMatchId);

	if (!finalMatch) {
		return [];
	}

	const rounds: T[][] = [];
	let currentRound = [finalMatch];

	// go backwards through the rounds
	while (currentRound.length > 0) {
		rounds.unshift(currentRound);

		// find the matches in the previous round that point to matches in the current round
		const nextRoundIds = new Set(currentRound.map((match) => match.id));
		const prevRound = matches.filter(
			(match) => match.nextMatchId && nextRoundIds.has(match.nextMatchId)
		);

		currentRound = prevRound;
	}

	return rounds;
}
