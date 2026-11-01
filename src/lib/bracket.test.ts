import { describe, expect, it } from 'vitest';
import {
	buildBracketStructure,
	createBracket,
	minBracketRounds,
	type BracketOptions
} from '$lib/bracket';
import { BracketFormat, BracketSide, MatchSlot, MatchState, type LogicalMatch } from '$lib/types';
import { logicalMatch } from '$lib/test/fixtures';

function makeRosters(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: `r${i + 1}` }));
}

/** Maps each first-round roster A id to its opponent B id. */
function pairs(matches: { rosterAId: string | null; rosterBId: string | null }[]) {
	return new Map(matches.map((match) => [match.rosterAId, match.rosterBId]));
}

function create(
	rosterCount: number,
	previous: LogicalMatch[] = [],
	roundCount = 3,
	options: Partial<BracketOptions> = {}
) {
	const matches = createBracket(makeRosters(rosterCount), previous, roundCount, {
		avoidPreviousMatchups: false,
		format: BracketFormat.SINGLE_ELIMINATION,
		...options
	});

	return { matches, structure: buildBracketStructure(matches) };
}

describe('minBracketRounds', () => {
	it('returns 0 for fewer than two teams', () => {
		expect(minBracketRounds(0)).toBe(0);
		expect(minBracketRounds(1)).toBe(0);
	});

	it('rounds up to the next power of two', () => {
		expect(minBracketRounds(2)).toBe(1);
		expect(minBracketRounds(3)).toBe(2);
		expect(minBracketRounds(4)).toBe(2);
		expect(minBracketRounds(5)).toBe(3);
		expect(minBracketRounds(7)).toBe(3);
		expect(minBracketRounds(8)).toBe(3);
		expect(minBracketRounds(9)).toBe(4);
		expect(minBracketRounds(16)).toBe(4);
	});
});

describe('createBracket', () => {
	it('builds the expected round structure', () => {
		const { structure } = create(8);

		expect(structure.upper.map((round) => round.length)).toEqual([4, 2, 1]);
		expect(structure.upper.map((round) => round[0].round)).toEqual([2, 1, 0]);
		expect(structure.lower).toEqual([]);
		expect(structure.grandFinal).toEqual([]);

		const [first, second, final] = structure.upper;
		expect(final[0].nextMatchId).toBeNull();

		// both semifinals feed the final
		expect(second.every((match) => match.nextMatchId === final[0].id)).toBe(true);
		expect(second[0].nextSlot).toBe(MatchSlot.A);
		expect(second[1].nextSlot).toBe(MatchSlot.B);

		// quarter-finals 0/1 feed semifinal 0, quarter-finals 2/3 feed semifinal 1
		expect(first[0].nextMatchId).toBe(second[0].id);
		expect(first[1].nextMatchId).toBe(second[0].id);
		expect(first[2].nextMatchId).toBe(second[1].id);
		expect(first[3].nextMatchId).toBe(second[1].id);
		expect(first.map((match) => match.nextSlot)).toEqual([
			MatchSlot.A,
			MatchSlot.B,
			MatchSlot.A,
			MatchSlot.B
		]);
	});

	it('marks every match as an upper-bracket match with explicit slots', () => {
		const { matches } = create(8);

		expect(matches.every((match) => match.bracketSide === BracketSide.UPPER)).toBe(true);
		expect(matches.every((match) => match.loserNextMatchId === null)).toBe(true);
		expect(matches.every((match) => match.nextMatchId === null || match.nextSlot !== null)).toBe(
			true
		);
	});

	it('seeds the first round highest against lowest', () => {
		const { structure } = create(8);
		const first = pairs(structure.upper[0]);

		expect(first.get('r1')).toBe('r8');
		expect(first.get('r2')).toBe('r7');
		expect(first.get('r3')).toBe('r6');
		expect(first.get('r4')).toBe('r5');
	});

	it('gives byes to the top seeds and advances them automatically', () => {
		const { structure } = create(6);
		const [first, second] = structure.upper;

		const byes = first.filter((match) => match.state === MatchState.WALKOVER);
		expect(byes).toHaveLength(2);
		expect(byes.map((match) => match.rosterAId).sort()).toEqual(['r1', 'r2']);
		expect(byes.every((match) => match.teamAScore === 3 && match.rosterBId === null)).toBe(true);

		// the byes are advanced into the semifinals
		expect(second[0].rosterAId).toBe('r1');
		expect(second[1].rosterAId).toBe('r2');

		const played = first.filter((match) => match.state !== MatchState.WALKOVER);
		expect(played.map((match) => [match.rosterAId, match.rosterBId])).toEqual([
			['r4', 'r5'],
			['r3', 'r6']
		]);
	});

	it('drops the lowest seeds when there are more rosters than slots', () => {
		const { structure } = create(10);
		const used = new Set(
			structure.upper[0]
				.flatMap((match) => [match.rosterAId, match.rosterBId])
				.filter((id): id is string => id !== null)
		);

		expect(used.has('r9')).toBe(false);
		expect(used.has('r10')).toBe(false);
		expect(used.size).toBe(8);
	});

	it('avoids pairing rosters that already met', () => {
		const previous: LogicalMatch[] = [logicalMatch({ rosterAId: 'r1', rosterBId: 'r8' })];

		const avoided = create(8, previous, 3, { avoidPreviousMatchups: true });
		expect(pairs(avoided.structure.upper[0]).get('r1')).toBe('r7');

		const allowed = create(8, previous, 3, { avoidPreviousMatchups: false });
		expect(pairs(allowed.structure.upper[0]).get('r1')).toBe('r8');
	});

	it('falls back to the next available roster when every opponent has been faced', () => {
		const previous: LogicalMatch[] = [
			logicalMatch({ rosterAId: 'r1', rosterBId: 'r2' }),
			logicalMatch({ rosterAId: 'r1', rosterBId: 'r3' }),
			logicalMatch({ rosterAId: 'r1', rosterBId: 'r4' })
		];

		const { structure } = create(4, previous, 2, { avoidPreviousMatchups: true });
		const first = pairs(structure.upper[0]);

		expect(first.get('r1')).toBe('r2');
		expect(first.get('r3')).toBe('r4');
	});

	it('rejects double elimination with a single round', () => {
		expect(() =>
			createBracket(makeRosters(2), [], 1, {
				avoidPreviousMatchups: false,
				format: BracketFormat.DOUBLE_ELIMINATION
			})
		).toThrow();
	});
});

describe('buildBracketStructure', () => {
	it('groups a flat list of matches into rounds', () => {
		const { matches, structure } = create(8);
		const rebuilt = buildBracketStructure(matches);

		expect(rebuilt.upper.map((round) => round.length)).toEqual([4, 2, 1]);
		expect(rebuilt.upper[2][0].id).toBe(structure.upper[2][0].id);
		expect(rebuilt.upper[2][0].id).toBe(matches.find((match) => match.round === 0)?.id);
	});

	it('returns empty brackets when there are no matches', () => {
		expect(buildBracketStructure([])).toEqual({
			upper: [],
			lower: [],
			grandFinal: []
		});
	});
});
