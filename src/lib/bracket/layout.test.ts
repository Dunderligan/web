import { describe, expect, it } from 'vitest';
import { createBracket } from '$lib/bracket';
import {
	MATCH_HEIGHT,
	MATCH_WIDTH,
	buildBracketLayout,
	orderEdgesForPainting
} from '$lib/bracket/layout';
import {
	BracketFormat,
	BracketSide,
	MatchState,
	type ResolvedMatchWithSeeds,
	type UnresolvedMatchWithOrder
} from '$lib/types';

const COLUMN_GAP = 24;
const MATCH_GAP = 12;

function makeRosters(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: `r${i + 1}` }));
}

function resolveMatches(matches: UnresolvedMatchWithOrder[]): ResolvedMatchWithSeeds[] {
	const rosters = new Map<string, { id: string; name: string; slug: string; seed: number }>();

	for (const match of matches) {
		for (const id of [match.rosterAId, match.rosterBId]) {
			if (id && !rosters.has(id)) {
				rosters.set(id, { id, name: id, slug: id, seed: 0 });
			}
		}
	}

	return matches.map((match) => ({
		...match,
		rosterA: match.rosterAId ? rosters.get(match.rosterAId)! : null,
		rosterB: match.rosterBId ? rosters.get(match.rosterBId)! : null
	}));
}

function create(
	rosterCount: number,
	roundCount: number,
	format: BracketFormat
): ResolvedMatchWithSeeds[] {
	const matches = createBracket(makeRosters(rosterCount), [], roundCount, {
		avoidPreviousMatchups: false,
		format
	});

	return resolveMatches(matches);
}

function expectNoOverlap(nodes: { column: number; x: number; y: number; visible: boolean }[]) {
	const visible = nodes.filter((node) => node.visible);

	for (let i = 0; i < visible.length; i++) {
		for (let j = i + 1; j < visible.length; j++) {
			const a = visible[i];
			const b = visible[j];

			if (a.column !== b.column) continue;

			expect(a.x).toBe(b.x);
			expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(MATCH_HEIGHT);
		}
	}
}

describe('buildBracketLayout', () => {
	it('lays out a single-elimination bracket', () => {
		const layout = buildBracketLayout(
			create(8, 3, BracketFormat.SINGLE_ELIMINATION),
			BracketFormat.SINGLE_ELIMINATION
		);

		expect(layout.nodes).toHaveLength(7);
		expect(layout.nodes.every((node) => node.visible)).toBe(true);
		expect(layout.edges).toHaveLength(6);
		expect(layout.width).toBe(3 * MATCH_WIDTH + 2 * COLUMN_GAP);
		expect(layout.height).toBe(3 * (MATCH_HEIGHT + MATCH_GAP) + MATCH_HEIGHT);
		expectNoOverlap(layout.nodes);
	});

	it('uses the round number to place rounds left to right', () => {
		const layout = buildBracketLayout(
			create(8, 3, BracketFormat.SINGLE_ELIMINATION),
			BracketFormat.SINGLE_ELIMINATION
		);

		const final = layout.nodes.find((node) => node.match.round === 0)!;
		const semifinals = layout.nodes.filter((node) => node.match.round === 1);
		const quarterfinals = layout.nodes.filter((node) => node.match.round === 2);

		expect(final.column).toBe(2);
		expect(semifinals.map((node) => node.column)).toEqual([1, 1]);
		expect(quarterfinals.map((node) => node.column)).toEqual([0, 0, 0, 0]);
	});

	it('lays out a double-elimination bracket with a grand final', () => {
		const layout = buildBracketLayout(
			create(8, 3, BracketFormat.DOUBLE_ELIMINATION),
			BracketFormat.DOUBLE_ELIMINATION
		);

		expect(layout.nodes).toHaveLength(14);
		expect(layout.nodes.every((node) => node.visible)).toBe(true);
		expect(layout.edges).toHaveLength(13);

		const grandFinal = layout.nodes.find(
			(node) => node.match.bracketSide === BracketSide.GRAND_FINAL
		)!;

		expect(grandFinal.column).toBe(5);
		expect(grandFinal.visible).toBe(true);

		// lower rounds sit to the right of the first upper round
		for (const node of layout.nodes.filter(
			(node) => node.match.bracketSide === BracketSide.LOWER
		)) {
			expect(node.column).toBeGreaterThanOrEqual(1);
			expect(node.column).toBeLessThanOrEqual(4);
		}

		expectNoOverlap(layout.nodes);
	});

	it('hides byes and empty lower-bracket matches', () => {
		const layout = buildBracketLayout(
			create(6, 3, BracketFormat.DOUBLE_ELIMINATION),
			BracketFormat.DOUBLE_ELIMINATION
		);

		const lowerFirstRound = layout.nodes.filter(
			(node) => node.match.bracketSide === BracketSide.LOWER && node.match.round === 4
		);

		expect(lowerFirstRound).toHaveLength(2);
		expect(lowerFirstRound.every((node) => !node.visible)).toBe(true);

		const upperWithByes = layout.nodes.filter(
			(node) => node.match.bracketSide === BracketSide.UPPER && node.match.round === 3
		);
		expect(upperWithByes.filter((node) => !node.visible)).toHaveLength(2);

		// only visible matches produce edges
		expect(layout.edges.every((edge) => edge.from.visible && edge.to.visible)).toBe(true);
		expect(layout.edges).toHaveLength(9);
	});

	it('collapses columns that only contain hidden matches', () => {
		const matches = create(4, 2, BracketFormat.SINGLE_ELIMINATION);
		const firstRound = matches.filter((match) => match.round === 1);

		// turn both first-round matches into byes
		for (const match of firstRound) {
			match.rosterB = null;
			match.state = MatchState.WALKOVER;
			match.teamAScore = 3;
		}

		const layout = buildBracketLayout(matches, BracketFormat.SINGLE_ELIMINATION);

		expect(layout.nodes.filter((node) => node.visible)).toHaveLength(1);
		expect(layout.width).toBe(MATCH_WIDTH);

		const final = layout.nodes.find((node) => node.match.round === 0)!;
		expect(final.visible).toBe(true);
		expect(final.x).toBe(0);
	});

	it('compacts first round when every other match is a bye', () => {
		const matches = create(8, 3, BracketFormat.SINGLE_ELIMINATION);
		const firstRound = matches.filter((match) => match.round === 2);

		// turn even-numbered first-round matches into byes
		for (const match of firstRound.filter((_, i) => i % 2 === 0)) {
			match.rosterB = null;
			match.state = MatchState.WALKOVER;
			match.teamAScore = 3;
		}

		const layout = buildBracketLayout(matches, BracketFormat.SINGLE_ELIMINATION);

		expect(layout.nodes.filter((node) => node.visible)).toHaveLength(5);
		expect(layout.width).toBe(2 * (MATCH_WIDTH + COLUMN_GAP) + MATCH_WIDTH);
		// the first column is compacted to only two matches
		expect(layout.height).toBe(2 * MATCH_HEIGHT + MATCH_GAP);
	});
});

describe('orderEdgesForPainting', () => {
	it('paints highlighted edges over overlapping unhighlighted edges', () => {
		const matches = create(8, 3, BracketFormat.SINGLE_ELIMINATION);
		const firstRound = matches.filter((match) => match.round === 2);
		const semifinals = matches.filter((match) => match.round === 1);
		const final = matches.find((match) => match.round === 0)!;

		// resolve the later rounds as if the top seeds won
		semifinals[0].rosterA = firstRound[0].rosterA;
		semifinals[0].rosterB = firstRound[1].rosterA;
		semifinals[1].rosterA = firstRound[2].rosterA;
		semifinals[1].rosterB = firstRound[3].rosterA;

		final.rosterA = semifinals[0].rosterA;
		final.rosterB = semifinals[1].rosterA;

		const layout = buildBracketLayout(matches, BracketFormat.SINGLE_ELIMINATION);
		const hoveredRosterId = semifinals[0].rosterA!.id;
		const ordered = orderEdgesForPainting(layout.edges, hoveredRosterId);

		const edgesIntoFinal = ordered.filter(({ edge }) => edge.to.match.id === final.id);
		expect(edgesIntoFinal).toHaveLength(2);

		const unhighlighted = edgesIntoFinal.findIndex((item) => !item.highlighted);
		const highlighted = edgesIntoFinal.findIndex((item) => item.highlighted);

		// the highlighted line is painted after the shared, unhighlighted one
		expect(highlighted).toBeGreaterThan(unhighlighted);
		expect(edgesIntoFinal[highlighted].edge.from.match.id).toBe(semifinals[0].id);
	});
});
