import { describe, expect, it } from 'vitest';
import { buildBracketRounds, createBracket, minBracketRounds } from '$lib/bracket';
import { MatchState, type LogicalMatch } from '$lib/types';
import { logicalMatch } from '$lib/test/fixtures';

function makeRosters(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: `r${i + 1}` }));
}

/** Maps each first-round roster A id to its opponent B id. */
function pairs(matches: { rosterAId: string | null; rosterBId: string | null }[]) {
	return new Map(matches.map((match) => [match.rosterAId, match.rosterBId]));
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
		const rounds = createBracket(makeRosters(8), [], 3, { avoidPreviousMatchups: false });

		expect(rounds.map((round) => round.length)).toEqual([4, 2, 1]);
		expect(rounds.map((round) => round[0].round)).toEqual([2, 1, 0]);

		const [first, second, final] = rounds;
		expect(final[0].nextMatchId).toBeUndefined();

		// both semifinals feed the final
		expect(second.every((match) => match.nextMatchId === final[0].id)).toBe(true);

		// quarter-finals 0/1 feed semifinal 0, quarter-finals 2/3 feed semifinal 1
		expect(first[0].nextMatchId).toBe(second[0].id);
		expect(first[1].nextMatchId).toBe(second[0].id);
		expect(first[2].nextMatchId).toBe(second[1].id);
		expect(first[3].nextMatchId).toBe(second[1].id);
	});

	it('seeds the first round highest against lowest', () => {
		const rounds = createBracket(makeRosters(8), [], 3, { avoidPreviousMatchups: false });
		const first = pairs(rounds[0]);

		expect(first.get('r1')).toBe('r8');
		expect(first.get('r2')).toBe('r7');
		expect(first.get('r3')).toBe('r6');
		expect(first.get('r4')).toBe('r5');
	});

	it('gives byes to the top seeds and advances them automatically', () => {
		const rounds = createBracket(makeRosters(6), [], 3, { avoidPreviousMatchups: false });
		const [first, second] = rounds;

		const byes = first.filter((match) => match.state === MatchState.WALKOVER);
		expect(byes).toHaveLength(2);
		expect(byes.map((match) => match.rosterAId).sort()).toEqual(['r1', 'r2']);
		expect(byes.every((match) => match.teamAScore === 3 && match.rosterBId === null)).toBe(true);

		// the byes are pre-advanced into the semifinals
		expect(second[0].rosterAId).toBe('r1');
		expect(second[1].rosterAId).toBe('r2');

		const played = first.filter((match) => match.state !== MatchState.WALKOVER);
		expect(played.map((match) => [match.rosterAId, match.rosterBId])).toEqual([
			['r4', 'r5'],
			['r3', 'r6']
		]);
	});

	it('drops the lowest seeds when there are more rosters than slots', () => {
		const rounds = createBracket(makeRosters(10), [], 3, { avoidPreviousMatchups: false });
		const used = new Set(
			rounds[0]
				.flatMap((match) => [match.rosterAId, match.rosterBId])
				.filter((id): id is string => id !== null)
		);

		expect(used.has('r9')).toBe(false);
		expect(used.has('r10')).toBe(false);
		expect(used.size).toBe(8);
	});

	it('avoids pairing rosters that already met', () => {
		const previous: LogicalMatch[] = [logicalMatch({ rosterAId: 'r1', rosterBId: 'r8' })];

		const avoided = createBracket(makeRosters(8), previous, 3, { avoidPreviousMatchups: true });
		expect(pairs(avoided[0]).get('r1')).toBe('r7');

		const allowed = createBracket(makeRosters(8), previous, 3, { avoidPreviousMatchups: false });
		expect(pairs(allowed[0]).get('r1')).toBe('r8');
	});

	it('falls back to the next available roster when every opponent has been faced', () => {
		const previous: LogicalMatch[] = [
			logicalMatch({ rosterAId: 'r1', rosterBId: 'r2' }),
			logicalMatch({ rosterAId: 'r1', rosterBId: 'r3' }),
			logicalMatch({ rosterAId: 'r1', rosterBId: 'r4' })
		];

		const rounds = createBracket(makeRosters(4), previous, 2, { avoidPreviousMatchups: true });
		const first = pairs(rounds[0]);

		expect(first.get('r1')).toBe('r2');
		expect(first.get('r3')).toBe('r4');
	});
});

describe('buildBracketRounds', () => {
	it('reconstructs the rounds from a flat match list', () => {
		const rounds = createBracket(makeRosters(8), [], 3, { avoidPreviousMatchups: false });
		const rebuilt = buildBracketRounds(rounds.flat());

		expect(rebuilt.map((round) => round.length)).toEqual([4, 2, 1]);
		expect(rebuilt[2][0].id).toBe(rounds[2][0].id);
	});

	it('returns an empty list when there is no final match', () => {
		expect(buildBracketRounds([])).toEqual([]);
	});
});
