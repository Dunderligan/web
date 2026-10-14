import { describe, expect, it } from 'vitest';
import { calculateStandings, sortBySeed } from '$lib/standings';
import { MatchState } from '$lib/types';
import { logicalMatch, roster } from '$lib/test/fixtures';

function rosterIds(rows: { rosterId: string }[]) {
	return rows.map((row) => row.rosterId);
}

describe('calculateStandings', () => {
	it('returns an empty table for no rosters', () => {
		expect(calculateStandings([], [])).toEqual([]);
	});

	it('returns a zeroed row for a roster without matches', () => {
		const rows = calculateStandings([roster('a')], []);
		expect(rows).toEqual([
			{ rosterId: 'a', score: { mapWins: 0, mapLosses: 0, mapDraws: 0, matchesPlayed: 0 } }
		]);
	});

	it('ranks the winner of a match first and tallies the maps', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b')],
			[logicalMatch({ rosterAId: 'a', rosterBId: 'b', teamAScore: 3, teamBScore: 1 })]
		);

		expect(rosterIds(rows)).toEqual(['a', 'b']);
		expect(rows[0].score).toEqual({ mapWins: 3, mapLosses: 1, mapDraws: 0, matchesPlayed: 1 });
		expect(rows[1].score).toEqual({ mapWins: 1, mapLosses: 3, mapDraws: 0, matchesPlayed: 1 });
	});

	it('counts walkovers as played matches', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b')],
			[
				logicalMatch({
					rosterAId: 'a',
					rosterBId: 'b',
					teamAScore: 3,
					teamBScore: 0,
					state: MatchState.WALKOVER
				})
			]
		);

		expect(rosterIds(rows)).toEqual(['a', 'b']);
		expect(rows[0].score).toEqual({ mapWins: 3, mapLosses: 0, mapDraws: 0, matchesPlayed: 1 });
	});

	it('ignores matches without a recorded score', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b')],
			[
				logicalMatch({
					rosterAId: 'a',
					rosterBId: 'b',
					teamAScore: 3,
					teamBScore: 0,
					state: MatchState.SCHEDULED
				}),
				logicalMatch({
					rosterAId: 'a',
					rosterBId: 'b',
					teamAScore: 3,
					teamBScore: 0,
					state: MatchState.CANCELLED
				})
			]
		);

		expect(rows.every((row) => row.score.matchesPlayed === 0)).toBe(true);
	});

	it('ignores matches with an unresolved roster', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: null, teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'a', rosterBId: 'missing', teamAScore: 3, teamBScore: 0 })
			]
		);

		expect(rows.every((row) => row.score.matchesPlayed === 0)).toBe(true);
	});

	it('credits a draw to both sides', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b')],
			[logicalMatch({ rosterAId: 'a', rosterBId: 'b', teamAScore: 1, teamBScore: 1, draws: 1 })]
		);

		for (const row of rows) {
			expect(row.score).toEqual({ mapWins: 1, mapLosses: 1, mapDraws: 1, matchesPlayed: 1 });
		}
	});

	it('seeds resigned rosters last regardless of record', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b', true)],
			[logicalMatch({ rosterAId: 'b', rosterBId: 'a', teamAScore: 3, teamBScore: 0 })]
		);

		expect(rosterIds(rows)).toEqual(['a', 'b']);
	});

	it('breaks ties by map wins', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'c', teamAScore: 2, teamBScore: 1 })
			]
		);

		expect(rosterIds(rows)).toEqual(['a', 'b', 'c']);
	});

	it('breaks ties by match wins when map wins are equal', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c'), roster('d'), roster('e')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 2, teamBScore: 1 }),
				logicalMatch({ rosterAId: 'a', rosterBId: 'd', teamAScore: 2, teamBScore: 1 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'e', teamAScore: 4, teamBScore: 0 })
			]
		);

		const order = rosterIds(rows);
		// a and b have map wins of 4, but b has more match wins (both c and d compared to just e)
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});

	it('breaks ties by map draws', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c'), roster('d'), roster('e')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 1, teamBScore: 1, draws: 1 }),
				logicalMatch({ rosterAId: 'a', rosterBId: 'd', teamAScore: 1, teamBScore: 1, draws: 0 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'e', teamAScore: 2, teamBScore: 2, draws: 0 })
			]
		);

		const order = rosterIds(rows);
		// a and b have map wins of 2, but a has more map draws (1-0)
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});

	it('breaks ties by head-to-head results', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c'), roster('d')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'c', rosterBId: 'b', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'd', teamAScore: 3, teamBScore: 0 })
			]
		);

		const order = rosterIds(rows);
		// a and b have equal map wins, match wins and draws,
		// but a beat c which in turn beat b, so a is ranked higher
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});

	it("breaks ties by the opponents' map record", () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c'), roster('d'), roster('e')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'd', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'e', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'd', rosterBId: 'e', teamAScore: 3, teamBScore: 0 })
			]
		);

		const order = rosterIds(rows);

		// a and b have equal map wins, match wins, draws and head-to-head results,
		// but a's opponents (d) has a better map record than b's opponents (e) (3-0 vs 0-3)
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});

	it('falls back to the strength of the beaten opponents', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c'), roster('d'), roster('e'), roster('f')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'd', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'c', rosterBId: 'e', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'd', rosterBId: 'f', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'e', rosterBId: 'f', teamAScore: 1, teamBScore: 0 })
			]
		);

		const order = rosterIds(rows);

		// a and b have equal map wins, match wins, draws, head-to-head results and opponent map records,
		// but a beat c which beat e, whereas b beat d which beat f. In turn, since e beat f, a's beaten
		// opponents are higher ranked than b's beaten opponents, so a is ranked higher.
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});

	it('falls back to the strength of the lost opponents', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b'), roster('c'), roster('d'), roster('e'), roster('f')],
			[
				logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 0, teamBScore: 3 }),
				logicalMatch({ rosterAId: 'b', rosterBId: 'd', teamAScore: 0, teamBScore: 3 }),
				logicalMatch({ rosterAId: 'c', rosterBId: 'e', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'd', rosterBId: 'f', teamAScore: 3, teamBScore: 0 }),
				logicalMatch({ rosterAId: 'e', rosterBId: 'f', teamAScore: 1, teamBScore: 0 })
			]
		);

		const order = rosterIds(rows);

		// Like the test above, except a and b end up losing their matches to c and d respectively.
		// Since c is ranked higher than d, a's opponents are stronger than b's opponents, so a is ranked higher.
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});

	it('retains order for rosters with equal records', () => {
		const rows = calculateStandings(
			[roster('a'), roster('b')],
			[logicalMatch({ rosterAId: 'a', rosterBId: 'b', teamAScore: 1, teamBScore: 1, draws: 1 })]
		);

		expect(rosterIds(rows)).toEqual(['a', 'b']);
	});
});

describe('legacy seeding', () => {
	const rosters = [roster('a'), roster('b'), roster('c'), roster('d'), roster('e')];
	const matches = [
		logicalMatch({ rosterAId: 'a', rosterBId: 'c', teamAScore: 2, teamBScore: 1 }),
		logicalMatch({ rosterAId: 'a', rosterBId: 'd', teamAScore: 2, teamBScore: 1 }),
		logicalMatch({ rosterAId: 'b', rosterBId: 'e', teamAScore: 4, teamBScore: 0 })
	];

	it('ranks fewer map losses higher, even with fewer match wins', () => {
		const order = rosterIds(calculateStandings(rosters, matches, { legacy: true }));
		expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'));
	});

	it('ranks more match wins higher in modern mode', () => {
		const order = rosterIds(calculateStandings(rosters, matches));
		expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
	});
});

describe('sortBySeed', () => {
	it('sorts the roster array in place by seed', () => {
		const rosters = [roster('b'), roster('a')];

		sortBySeed(rosters, [
			logicalMatch({ rosterAId: 'a', rosterBId: 'b', teamAScore: 3, teamBScore: 0 })
		]);

		expect(rosters.map((r) => r.id)).toEqual(['a', 'b']);
	});
});
