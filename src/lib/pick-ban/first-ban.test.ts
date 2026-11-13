import { describe, expect, it } from 'vitest';
import { MatchSlot } from '$lib/types';
import { firstBanTeam, firstMapFirstBanTeam, nextMapFirstBanTeam } from './first-ban';
import { MapOutcome } from './types';
import { resultedMap } from './test-helpers';

describe('firstMapFirstBanTeam', () => {
	it('gives the first ban to the worse initial seed in a group match', () => {
		// Seed 1 is strongest, so seed 4 is the lower seed.
		expect(firstMapFirstBanTeam({ a: 4, b: 1 })).toBe(MatchSlot.A);
		expect(firstMapFirstBanTeam({ a: 1, b: 4 })).toBe(MatchSlot.B);
	});

	it('uses the same rule for bracket placements', () => {
		expect(firstMapFirstBanTeam({ a: 2, b: 5 })).toBe(MatchSlot.B);
		expect(firstMapFirstBanTeam({ a: 6, b: 3 })).toBe(MatchSlot.A);
	});

	it('fails loudly when a seed is missing', () => {
		expect(() => firstMapFirstBanTeam({ a: null, b: 3 })).toThrow();
		expect(() => firstMapFirstBanTeam({ a: 3, b: null })).toThrow();
		expect(() => firstMapFirstBanTeam({ a: null, b: null })).toThrow();
	});

	it('uses slot A as a deterministic tie-break', () => {
		expect(firstMapFirstBanTeam({ a: 2, b: 2 })).toBe(MatchSlot.A);
	});
});

describe('nextMapFirstBanTeam', () => {
	it('gives the first ban to the loser of a won map', () => {
		expect(nextMapFirstBanTeam(resultedMap(MapOutcome.TEAM_A))).toBe(MatchSlot.B);
		expect(nextMapFirstBanTeam(resultedMap(MapOutcome.TEAM_B))).toBe(MatchSlot.A);
	});

	it('keeps the first-ban team after a draw', () => {
		expect(nextMapFirstBanTeam(resultedMap(MapOutcome.DRAW, { firstBanSlot: MatchSlot.B }))).toBe(
			MatchSlot.B
		);
	});

	it('throws when the previous map has no result', () => {
		expect(() => nextMapFirstBanTeam(resultedMap(MapOutcome.TEAM_A, { outcome: null }))).toThrow();
	});
});

describe('firstBanTeam', () => {
	it('uses the seeds for the first map', () => {
		expect(firstBanTeam([], { a: 1, b: 3 })).toBe(MatchSlot.B);
	});

	it('uses the previous map result for later maps', () => {
		const first = resultedMap(MapOutcome.TEAM_B, { index: 0 });
		expect(firstBanTeam([first], { a: 1, b: 3 })).toBe(MatchSlot.A);
	});
});
