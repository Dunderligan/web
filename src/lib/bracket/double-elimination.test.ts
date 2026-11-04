import { describe, expect, it } from 'vitest';
import { buildBracketStructure, createBracket, propagateBracket } from '$lib/bracket';
import { getBracketEdges } from '$lib/bracket/graph';
import { BracketFormat, MatchSlot, MatchState, type UnresolvedMatchWithOrder } from '$lib/types';

function makeRosters(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: `r${i + 1}` }));
}

function createDouble(rosterCount: number, roundCount = 3) {
	const matches = createBracket(makeRosters(rosterCount), [], roundCount, {
		avoidPreviousMatchups: false,
		format: BracketFormat.DOUBLE_ELIMINATION
	});

	return { matches, structure: buildBracketStructure(matches) };
}

function play(match: UnresolvedMatchWithOrder, winner: MatchSlot) {
	match.state = MatchState.PLAYED;
	match.teamAScore = winner === MatchSlot.A ? 3 : 0;
	match.teamBScore = winner === MatchSlot.B ? 3 : 0;
}

function expectPlayable(match: UnresolvedMatchWithOrder) {
	expect(match.rosterAId).not.toBeNull();
	expect(match.rosterBId).not.toBeNull();
}

function rosterCount(match: UnresolvedMatchWithOrder) {
	return Number(match.rosterAId !== null) + Number(match.rosterBId !== null);
}

describe('createBracket (double elimination)', () => {
	it('builds the expected structure for 8 teams', () => {
		const { matches, structure } = createDouble(8);

		expect(matches).toHaveLength(14); // 2N - 2
		expect(structure.upper.map((round) => round.length)).toEqual([4, 2, 1]);
		expect(structure.upper.map((round) => round[0].round)).toEqual([3, 2, 1]);
		expect(structure.lower.map((round) => round.length)).toEqual([2, 2, 1, 1]);
		expect(structure.lower.map((round) => round[0].round)).toEqual([4, 3, 2, 1]);
		expect(structure.grandFinal).toHaveLength(1);
		expect(structure.grandFinal[0].round).toBe(0);
	});

	it('builds the expected structure for 16 teams', () => {
		const { matches, structure } = createDouble(16, 4);

		expect(matches).toHaveLength(30);
		expect(structure.upper.map((round) => round.length)).toEqual([8, 4, 2, 1]);
		expect(structure.lower.map((round) => round.length)).toEqual([4, 4, 2, 2, 1, 1]);
	});

	it('builds the expected structure for 4 teams', () => {
		const { matches, structure } = createDouble(4, 2);

		expect(matches).toHaveLength(6);
		expect(structure.upper.map((round) => round.length)).toEqual([2, 1]);
		expect(structure.lower.map((round) => round.length)).toEqual([1, 1]);
		expect(structure.grandFinal).toHaveLength(1);
	});

	it('marks every match with its bracket side and links', () => {
		const { matches, structure } = createDouble(8);
		const [upperFinal] = structure.upper.slice(-1);
		const [lowerFinal] = structure.lower.slice(-1);
		const [grandFinal] = structure.grandFinal;

		expect(matches.every((match) => match.bracketSide !== null)).toBe(true);
		expect(structure.upper.flat().every((match) => match.loserNextMatchId !== null)).toBe(true);
		expect(structure.lower.flat().every((match) => match.loserNextMatchId === null)).toBe(true);

		expect(upperFinal[0].nextMatchId).toBe(grandFinal.id);
		expect(upperFinal[0].nextSlot).toBe(MatchSlot.A);
		expect(lowerFinal[0].nextMatchId).toBe(grandFinal.id);
		expect(lowerFinal[0].nextSlot).toBe(MatchSlot.B);
	});

	it('builds a complete edge graph', () => {
		const { matches } = createDouble(8);
		const edges = getBracketEdges(matches);

		expect(edges).toHaveLength(20);
		expect(edges.filter((edge) => edge.outcome === 'winner')).toHaveLength(13);
		expect(edges.filter((edge) => edge.outcome === 'loser')).toHaveLength(7);
	});

	it('cascades byes through the lower bracket', () => {
		const { matches, structure } = createDouble(6);
		const upperFirstRound = structure.upper[0];

		const byes = upperFirstRound.filter((match) => match.state === MatchState.WALKOVER);
		expect(byes).toHaveLength(2);
		expect(byes.map((match) => match.rosterAId).sort()).toEqual(['r1', 'r2']);

		// the lower bracket is waiting for the real first-round matches
		const lowerFirstRound = structure.lower[0];
		expect(lowerFirstRound.every((match) => match.rosterAId === null)).toBe(true);
		expect(lowerFirstRound.every((match) => match.rosterBId === null)).toBe(true);

		// once the real first-round matches are played, the byes resolve in the lower bracket
		for (const match of upperFirstRound.filter((m) => m.state !== MatchState.WALKOVER)) {
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		expect(lowerFirstRound.every((match) => match.state === MatchState.WALKOVER)).toBe(true);
		expect(lowerFirstRound.every((match) => rosterCount(match) === 1)).toBe(true);

		// and those teams advance into the next lower round
		expect(structure.lower[1].every((match) => match.rosterAId !== null)).toBe(true);
	});
});

describe('propagateBracket', () => {
	it('advances winners and drops losers into the lower bracket', () => {
		const { matches, structure } = createDouble(8);
		const upperFirstRound = structure.upper[0];
		const lowerFirstRound = structure.lower[0];
		const upperSecondRound = structure.upper[1];

		for (const match of upperFirstRound) {
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		expect(upperSecondRound[0].rosterAId).toBe(upperFirstRound[0].rosterAId);
		expect(upperSecondRound[0].rosterBId).toBe(upperFirstRound[1].rosterAId);
		expect(upperSecondRound[1].rosterAId).toBe(upperFirstRound[2].rosterAId);
		expect(upperSecondRound[1].rosterBId).toBe(upperFirstRound[3].rosterAId);

		expect(lowerFirstRound[0].rosterAId).toBe(upperFirstRound[0].rosterBId);
		expect(lowerFirstRound[0].rosterBId).toBe(upperFirstRound[1].rosterBId);
		expect(lowerFirstRound[1].rosterAId).toBe(upperFirstRound[2].rosterBId);
		expect(lowerFirstRound[1].rosterBId).toBe(upperFirstRound[3].rosterBId);
	});

	it('overwrites downstream rosters when an earlier result is corrected', () => {
		const { matches, structure } = createDouble(8);
		const [first, second] = structure.upper[0];
		const lowerFirstRound = structure.lower[0];

		for (const match of structure.upper[0]) {
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		const originalWinner = first.rosterAId;
		const originalLoser = first.rosterBId;

		expect(structure.upper[1][0].rosterAId).toBe(originalWinner);
		expect(lowerFirstRound[0].rosterAId).toBe(originalLoser);

		play(first, MatchSlot.B);
		propagateBracket(matches);

		expect(structure.upper[1][0].rosterAId).toBe(originalLoser);
		expect(lowerFirstRound[0].rosterAId).toBe(originalWinner);
		// the second match is unaffected
		expect(structure.upper[1][0].rosterBId).toBe(second.rosterAId);
	});

	it('plays a whole bracket through to the grand final', () => {
		const { matches, structure } = createDouble(8);
		const [upperFirstRound, upperSecondRound] = structure.upper;
		const upperFinal = structure.upper[2][0];
		const [lowerFirstRound, lowerSecondRound, lowerThirdRound] = structure.lower;
		const lowerFinal = structure.lower[3][0];
		const grandFinal = structure.grandFinal[0];

		for (const match of upperFirstRound) {
			expectPlayable(match);
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		for (const match of upperSecondRound) {
			expectPlayable(match);
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		for (const match of lowerFirstRound) {
			expectPlayable(match);
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		expectPlayable(upperFinal);
		play(upperFinal, MatchSlot.A);
		propagateBracket(matches);

		for (const match of lowerSecondRound) {
			expectPlayable(match);
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		for (const match of lowerThirdRound) {
			expectPlayable(match);
			play(match, MatchSlot.A);
		}
		propagateBracket(matches);

		expectPlayable(lowerFinal);
		play(lowerFinal, MatchSlot.A);
		propagateBracket(matches);

		expectPlayable(grandFinal);
		expect(grandFinal.rosterAId).toBe(upperFinal.rosterAId);
		expect(grandFinal.rosterBId).toBe(lowerFinal.rosterAId);
		expect(grandFinal.rosterAId).not.toBe(grandFinal.rosterBId);

		play(grandFinal, MatchSlot.A);
		propagateBracket(matches);

		expect(grandFinal.state).toBe(MatchState.PLAYED);
		expect(grandFinal.teamAScore).toBe(3);
	});
});
