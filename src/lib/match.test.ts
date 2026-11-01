import { describe, expect, it } from 'vitest';
import {
	compareMatchDates,
	createGroupMatch,
	flipSide,
	getFinalMatch,
	getRosterPlacement,
	hasMatchScore,
	isInMatch,
	isMatchBetween,
	isWinner,
	matchNote,
	matchRoster,
	matchRosterId,
	matchScore,
	matchWinner,
	resolvedMatchToLogical
} from '$lib/match';
import { MatchState, type MatchWithoutRosters } from '$lib/types';
import { logicalMatch, matchRoster as makeRoster, resolvedMatch } from '$lib/test/fixtures';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('hasMatchScore', () => {
	it('is true for played and walkover matches', () => {
		expect(hasMatchScore(logicalMatch({ state: MatchState.PLAYED }))).toBe(true);
		expect(hasMatchScore(logicalMatch({ state: MatchState.WALKOVER }))).toBe(true);
	});

	it('is false for scheduled and cancelled matches', () => {
		expect(hasMatchScore(logicalMatch({ state: MatchState.SCHEDULED }))).toBe(false);
		expect(hasMatchScore(logicalMatch({ state: MatchState.CANCELLED }))).toBe(false);
	});
});

describe('isInMatch / isMatchBetween', () => {
	const match = logicalMatch({ rosterAId: 'a', rosterBId: 'b' });

	it('detects rosters on either side', () => {
		expect(isInMatch(match, 'a')).toBe(true);
		expect(isInMatch(match, 'b')).toBe(true);
		expect(isInMatch(match, 'c')).toBe(false);
	});

	it('detects a match between two rosters regardless of side', () => {
		expect(isMatchBetween(match, 'a', 'b')).toBe(true);
		expect(isMatchBetween(match, 'b', 'a')).toBe(true);
		expect(isMatchBetween(match, 'a', 'c')).toBe(false);
	});

	it('does not treat unresolved rosters as participants', () => {
		const empty = logicalMatch({ rosterAId: null, rosterBId: null });
		expect(isInMatch(empty, 'a')).toBe(false);
	});
});

describe('flipSide', () => {
	it('flips the side by default', () => {
		expect(flipSide('A')).toBe('B');
		expect(flipSide('B')).toBe('A');
	});

	it('keeps the side when flip is false', () => {
		expect(flipSide('A', false)).toBe('A');
		expect(flipSide('B', false)).toBe('B');
		expect(flipSide('A', true)).toBe('B');
	});
});

describe('matchScore', () => {
	it('returns the score for each side', () => {
		const match = logicalMatch({ teamAScore: 3, teamBScore: 1 });
		expect(matchScore(match, 'A')).toBe(3);
		expect(matchScore(match, 'B')).toBe(1);
	});
});

describe('matchWinner', () => {
	it('returns the side with the higher score', () => {
		expect(matchWinner(logicalMatch({ teamAScore: 3, teamBScore: 1 }))).toBe('A');
		expect(matchWinner(logicalMatch({ teamAScore: 0, teamBScore: 3 }))).toBe('B');
	});

	it('returns null for a draw', () => {
		expect(matchWinner(logicalMatch({ teamAScore: 2, teamBScore: 2 }))).toBeNull();
	});

	it('returns null when the match has no recorded score', () => {
		expect(
			matchWinner(
				logicalMatch({
					teamAScore: 3,
					teamBScore: 0,
					state: MatchState.SCHEDULED
				})
			)
		).toBeNull();
		expect(
			matchWinner(
				logicalMatch({
					teamAScore: 3,
					teamBScore: 0,
					state: MatchState.CANCELLED
				})
			)
		).toBeNull();
	});
});

describe('matchRoster / matchNote', () => {
	it('returns the roster for a side, or null when unresolved', () => {
		const match = { rosterA: makeRoster('a'), rosterB: null };
		expect(matchRoster(match, 'A')?.id).toBe('a');
		expect(matchRoster(match, 'B')).toBeNull();
	});

	it('returns the note for a side, or null when absent', () => {
		const match: MatchWithoutRosters = {
			id: 'm',
			teamAScore: 0,
			teamBScore: 0,
			draws: 0,
			state: MatchState.PLAYED,
			teamANote: 'note A',
			teamBNote: null
		};
		expect(matchNote(match, 'A')).toBe('note A');
		expect(matchNote(match, 'B')).toBeNull();
	});
});

describe('isWinner', () => {
	it('is true only for the winning side', () => {
		const match = logicalMatch({ teamAScore: 3, teamBScore: 1 });
		expect(isWinner(match, 'A')).toBe(true);
		expect(isWinner(match, 'B')).toBe(false);
	});

	it('is false for both sides of a draw or an unplayed match', () => {
		expect(isWinner(logicalMatch({ teamAScore: 2, teamBScore: 2 }), 'A')).toBe(false);
		expect(
			isWinner(
				logicalMatch({
					teamAScore: 3,
					teamBScore: 0,
					state: MatchState.SCHEDULED
				}),
				'A'
			)
		).toBe(false);
	});
});

describe('matchRosterId', () => {
	const match = logicalMatch({ rosterAId: 'a', rosterBId: 'b' });

	it('returns the id for a side', () => {
		expect(matchRosterId(match, 'A')).toBe('a');
		expect(matchRosterId(match, 'B')).toBe('b');
	});

	it('returns null when the side is omitted or null', () => {
		expect(matchRosterId(match)).toBeNull();
		expect(matchRosterId(match, null)).toBeNull();
	});
});

describe('compareMatchDates', () => {
	function dated(playedAt: Date | null, scheduledAt: Date | null = null): MatchWithoutRosters {
		return {
			id: 'm',
			teamAScore: 0,
			teamBScore: 0,
			draws: 0,
			state: MatchState.PLAYED,
			playedAt,
			scheduledAt
		};
	}

	it('orders played matches most recent first', () => {
		const older = dated(new Date('2026-01-01T00:00:00Z'));
		const newer = dated(new Date('2026-02-01T00:00:00Z'));
		expect(compareMatchDates(older, newer)).toBeGreaterThan(0);
		expect(compareMatchDates(newer, older)).toBeLessThan(0);
	});

	it('puts a played match before a scheduled one', () => {
		const played = dated(new Date('2026-01-01T00:00:00Z'));
		const scheduled = dated(null, new Date('2026-03-01T00:00:00Z'));
		expect(compareMatchDates(played, scheduled)).toBe(-1);
		expect(compareMatchDates(scheduled, played)).toBe(1);
	});

	it('orders scheduled matches soonest first', () => {
		const soon = dated(null, new Date('2026-03-01T00:00:00Z'));
		const later = dated(null, new Date('2026-04-01T00:00:00Z'));
		expect(compareMatchDates(soon, later)).toBeLessThan(0);
		expect(compareMatchDates(later, soon)).toBeGreaterThan(0);
	});

	it('puts a dated match before an undated one', () => {
		expect(compareMatchDates(dated(null, new Date('2026-03-01')), dated(null))).toBe(-1);
		expect(compareMatchDates(dated(null), dated(null, new Date('2026-03-01')))).toBe(1);
	});

	it('returns 0 when neither match has a date', () => {
		expect(compareMatchDates(dated(null), dated(null))).toBe(0);
	});
});

describe('createGroupMatch', () => {
	it('creates an unresolved, scheduled match for the group', () => {
		const match = createGroupMatch('group-1');

		expect(match.id).toMatch(UUID_RE);
		expect(match.groupId).toBe('group-1');
		expect(match.state).toBe(MatchState.SCHEDULED);
		expect(match.rosterAId).toBeNull();
		expect(match.rosterBId).toBeNull();
		expect(match.teamAScore).toBe(0);
		expect(match.teamBScore).toBe(0);
		expect(match.draws).toBe(0);
		expect(match.bracketId).toBeNull();
		expect(match.divisionId).toBeNull();
		expect(match.nextMatchId).toBeNull();
		expect(match.round).toBeNull();
		expect(match.playedAt).toBeNull();
		expect(match.scheduledAt).toBeNull();
		expect(match.vodUrl).toBeNull();
	});
});

describe('resolvedMatchToLogical', () => {
	it('flattens rosters to their ids', () => {
		const resolved = resolvedMatch({
			state: MatchState.PLAYED,
			teamAScore: 3,
			teamBScore: 1,
			draws: 2,
			rosterA: makeRoster('a'),
			rosterB: makeRoster('b')
		});

		expect(resolvedMatchToLogical(resolved)).toEqual({
			rosterAId: 'a',
			rosterBId: 'b',
			teamAScore: 3,
			teamBScore: 1,
			draws: 2,
			state: MatchState.PLAYED
		});
	});

	it('maps missing rosters to null ids', () => {
		const resolved = resolvedMatch({ rosterA: null, rosterB: null });
		expect(resolvedMatchToLogical(resolved)).toMatchObject({
			rosterAId: null,
			rosterBId: null
		});
	});
});

describe('getFinalMatch', () => {
	it('returns the match with the lowest round number regardless of order', () => {
		const final = resolvedMatch({ id: 'final', round: 0 });
		const semi = resolvedMatch({ id: 'semi', round: 1 });

		expect(getFinalMatch([final, semi])?.id).toBe('final');
		expect(getFinalMatch([semi, final])?.id).toBe('final');
	});

	it('returns null when there are no matches', () => {
		expect(getFinalMatch([])).toBeNull();
	});

	it('never returns a match with a null round number', () => {
		const group = resolvedMatch({ round: null });
		const final = resolvedMatch({ round: 0 });

		expect(getFinalMatch([group, final])).toBe(final);
	});

	it('returns null when there are no matches with a round number', () => {
		const match = resolvedMatch({ round: null });
		expect(getFinalMatch([match])).toBeNull();
	});

	it('returns the first match when there are multiple matches with the same round number', () => {
		const match1 = resolvedMatch({ id: 'match1', round: 0 });
		const match2 = resolvedMatch({ id: 'match2', round: 0 });

		expect(getFinalMatch([match1, match2])).toBe(match1);
		expect(getFinalMatch([match2, match1])).toBe(match2);
	});
});

describe('getRosterPlacement', () => {
	it('returns null when the final match lacks a round', () => {
		expect(getRosterPlacement('a', 4, resolvedMatch({ round: null }))).toBeNull();
	});

	it('returns a null placement while the grand final is scheduled', () => {
		const final = resolvedMatch({
			round: 0,
			state: MatchState.SCHEDULED,
			rosterA: makeRoster('a'),
			rosterB: makeRoster('b')
		});
		expect(getRosterPlacement('a', 2, final)).toEqual({
			best: 1,
			worst: 2
		});
	});

	it('places the grand final winner first and the loser second', () => {
		const final = resolvedMatch({
			round: 0,
			state: MatchState.PLAYED,
			teamAScore: 3,
			teamBScore: 1,
			rosterA: makeRoster('a'),
			rosterB: makeRoster('b')
		});

		expect(getRosterPlacement('a', 2, final)).toEqual({
			best: 1,
			worst: 1
		});
		expect(getRosterPlacement('b', 2, final)).toEqual({
			best: 2,
			worst: 2
		});
	});

	it('leaves the grand final placement open when it is undecided', () => {
		const final = resolvedMatch({
			round: 0,
			state: MatchState.PLAYED,
			teamAScore: 2,
			teamBScore: 2,
			rosterA: makeRoster('a'),
			rosterB: makeRoster('b')
		});
		expect(getRosterPlacement('a', 2, final)).toEqual({
			best: 1,
			worst: 2
		});
	});

	it('brackets a loser of an earlier round, capped by the roster count', () => {
		const semi = resolvedMatch({
			round: 1,
			state: MatchState.PLAYED,
			teamAScore: 3,
			teamBScore: 0,
			rosterA: makeRoster('a'),
			rosterB: makeRoster('b')
		});

		expect(getRosterPlacement('b', 8, semi)).toEqual({
			best: 3,
			worst: 4
		});
		expect(getRosterPlacement('b', 3, semi)).toEqual({
			best: 3,
			worst: 3
		});
	});

	it('computes the placement range from the round number', () => {
		const quarter = resolvedMatch({
			round: 2,
			state: MatchState.PLAYED,
			teamAScore: 3,
			teamBScore: 0
		});
		expect(getRosterPlacement('x', 16, quarter)).toEqual({
			best: 5,
			worst: 8
		});
		expect(getRosterPlacement('x', 5, quarter)).toEqual({
			best: 5,
			worst: 5
		});
	});

	it('returns an capped worst placement when final match is scheduled', () => {
		const unplayedSemi = resolvedMatch({
			round: 1,
			state: MatchState.SCHEDULED,
			rosterA: makeRoster('a'),
			rosterB: makeRoster('b')
		});

		expect(getRosterPlacement('a', 8, unplayedSemi)).toEqual({
			best: 1,
			worst: 4 // made it to the semifinal; worst case is 4th place
		});
	});
});
