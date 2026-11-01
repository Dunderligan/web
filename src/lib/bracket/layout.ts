import { getBracketEdges, type BracketEdge } from './graph';
import { isInMatch, matchWinner, resolvedMatchToLogical } from '../match';
import {
	BracketFormat,
	BracketSide,
	MatchSlot,
	MatchState,
	type ResolvedMatchWithSeeds
} from '../types';
import { average } from '../util';

/** Size of a single match card, in pixels. */
export const MATCH_WIDTH = 250;
export const MATCH_HEIGHT = 115;
/** Size of the MatchInfoRow component at the top of each match card. */
export const INFO_ROW_HEIGHT = 20;
/** Width/height of the lines connecting matches. */
export const LINE_WIDTH = 2;
/** Height of each team slot in the match card. */
export const MATCH_SLOT_HEIGHT = (MATCH_HEIGHT - INFO_ROW_HEIGHT - LINE_WIDTH) / 2;
/**
 * The y-coordinate of the middle point of a match card were the line connects to it.
 * This is not the same as the absolute center of the card since it's offset by the info row.
 */
const MATCH_HALF_HEIGHT = (INFO_ROW_HEIGHT + MATCH_HEIGHT) / 2;

/** Horizontal space between two round columns. */
const COLUMN_GAP = 24;
/** Vertical space between two match cards in the same column. */
const MATCH_GAP = 12;
/** Vertical space between the upper and lower brackets. */
const BAND_GAP = 48;

export type BracketLayoutNode = {
	match: ResolvedMatchWithSeeds;
	x: number;
	y: number;
	/** Left-to-right position, before hidden columns are removed. */
	column: number;
	visible: boolean;
};

export type BracketLayoutEdge = {
	from: BracketLayoutNode;
	to: BracketLayoutNode;
	path: string;
};

export type BracketLayout = {
	width: number;
	height: number;
	nodes: BracketLayoutNode[];
	edges: BracketLayoutEdge[];
};

/**
 * Builds an absolute layout for a bracket.
 *
 * The layout has three responsibilities:
 * 1. decide which matches are worth rendering (byes and empty matches are not),
 * 2. place the remaining cards in a column/row grid,
 * 3. draw the lines between them.
 *
 * Only nextMatchId (winner) lines are drawn, not for lines leading down to the
 * lower bracket's matchees.
 */
export function buildBracketLayout(
	matches: ResolvedMatchWithSeeds[],
	format: BracketFormat
): BracketLayout {
	const graph = buildBracketGraph(matches);
	const extents = measureBracket(matches, format);
	const visibility = createVisibilityResolver(graph);

	const nodes: BracketLayoutNode[] = matches.map((match) => ({
		match,
		x: 0,
		y: 0,
		column: columnFor(match, extents),
		visible: visibility.isVisible(match)
	}));

	const nodesById = new Map(nodes.map((node) => [node.match.id, node]));
	const context: LayoutContext = { ...graph, nodesById };
	const lanes = groupNodesByLane(nodes);

	positionLane(lanes.upper, context, {
		lane: BracketSide.UPPER,
		firstRound: extents.upperMaxRound
	});

	positionLane(lanes.lower, context, {
		lane: BracketSide.LOWER,
		firstRound: extents.lowerMaxRound
	});

	// The two brackets are stacked on top of eachother; compute where the lower bracket
	// should begin based on the bottom of the upper bracket and the gap between them.
	const upperBottom = visibleBottom(lanes.upper);
	const lowerTop = upperBottom + (lanes.lower.some((node) => node.visible) ? BAND_GAP : 0);
	shiftLaneY(lanes.lower, lowerTop);

	// The grand final is vertically centred on the combined bracket, so its two
	// incoming winner lines can bend into it from the upper and lower finals.
	const contentBottom = Math.max(upperBottom, visibleBottom(lanes.lower));
	centerGrandFinal(lanes.grandFinal, contentBottom);

	const width = assignXPositions(nodes);

	const edges = buildLayoutEdges(context);

	return {
		width,
		height: visibleBottom(nodes),
		nodes,
		edges
	};
}

type BracketGraph = {
	matchesById: Map<string, ResolvedMatchWithSeeds>;
	edges: BracketEdge[];
	/** All edges grouped by the match they point into. */
	incomingEdges: Map<string, BracketEdge[]>;
};

type LayoutContext = BracketGraph & {
	nodesById: Map<string, BracketLayoutNode>;
};

type BracketExtents = {
	upperMaxRound: number;
	lowerMaxRound: number;
	hasLower: boolean;
};

/**
 * Indexes the match graph. Every match has at most two incoming edges (one per
 * slot), which the visibility and positioning code both need.
 */
function buildBracketGraph(matches: ResolvedMatchWithSeeds[]): BracketGraph {
	const matchesById = new Map(matches.map((match) => [match.id, match]));
	const edges = getBracketEdges(matches);
	const incomingEdges = new Map<string, BracketEdge[]>();

	for (const edge of edges) {
		const matchEdges = incomingEdges.get(edge.toId) ?? [];
		matchEdges.push(edge);
		incomingEdges.set(edge.toId, matchEdges);
	}

	return { matchesById, edges, incomingEdges };
}

/** Collects the round bounds that determine the column of every match. */
function measureBracket(matches: ResolvedMatchWithSeeds[], format: BracketFormat): BracketExtents {
	const upperMatches = matches.filter((match) => bracketSideOf(match) === BracketSide.UPPER);
	const lowerMatches = matches.filter((match) => bracketSideOf(match) === BracketSide.LOWER);

	return {
		upperMaxRound: maxRound(upperMatches),
		lowerMaxRound: maxRound(lowerMatches),
		hasLower: format === BracketFormat.DOUBLE_ELIMINATION || lowerMatches.length > 0
	};
}

/**
 * Maps a match to a left-to-right column.
 *
 * Round numbers count backwards from the end of a lane, so the final is round 0
 * and the first round has the highest number. Reversing that gives a natural
 * left-to-right order.
 *
 * The lower bracket starts one column after the upper first round, because its
 * first round is fed by upper first-round losers. The grand final is placed
 * after the lower final.
 */
function columnFor(match: ResolvedMatchWithSeeds, extents: BracketExtents): number {
	const side = bracketSideOf(match);
	const round = match.round ?? 0;

	if (side === BracketSide.UPPER) {
		return extents.upperMaxRound - round;
	}

	if (side === BracketSide.LOWER) {
		return extents.lowerMaxRound - round + 1;
	}

	// Grand final is always the last column, one beyond the other lanes' max round.
	return extents.hasLower ? extents.lowerMaxRound + 1 : extents.upperMaxRound + 1;
}

type VisibilityResolver = {
	isVisible(match: ResolvedMatchWithSeeds): boolean;
};

/**
 * Decides which matches should be rendered.
 *
 * A match is only worth showing if two teams can eventually meet in it. That is
 * not the same as "it currently has two rosters": an upcoming match legitimately
 * has TBD slots. Instead, each slot is asked whether any team can ever arrive
 * there.
 *
 * Byes are the interesting case. A bye has no loser, so the lower-bracket match
 * fed by that bye can never have two participants. Such matches stay hidden even
 * while the other feeder is still undecided, which avoids rendering TBD cards for
 * matches that will never be played.
 */
function createVisibilityResolver(graph: BracketGraph): VisibilityResolver {
	const possibleOutcomes = new Map<string, boolean>();

	/**
	 * Whether a match can ever produce the given outcome.
	 *
	 * For a terminal match this is direct: a winner exists for the winner output,
	 * and the loser output exists only if the match had two participants (a bye
	 * does not have a loser).
	 *
	 * For a scheduled match it is derived from its feeders. One possible feeder is
	 * enough for a winner (the other side becomes a bye), but both slots must be
	 * possible for a loser to exist.
	 */
	function isOutcomePossible(matchId: string, outcome: 'winner' | 'loser'): boolean {
		const key = `${matchId}:${outcome}`;
		const cached = possibleOutcomes.get(key);
		if (cached !== undefined) return cached;

		// guards against malformed cyclic data
		possibleOutcomes.set(key, false);

		const match = graph.matchesById.get(matchId);
		if (!match) return false;

		const rosters = rosterCount(match);
		let result: boolean;

		if (match.state === MatchState.SCHEDULED) {
			const feeders = graph.incomingEdges.get(matchId) ?? [];

			if (feeders.length === 0) {
				// A seeded first-round match has no feeders. A real match has two
				// rosters and can produce both outputs; a bye only has one.
				result = rosters >= (outcome === 'winner' ? 1 : 2);
			} else {
				const slots = possibleSlots(matchId);
				result = outcome === 'winner' ? slots.size >= 1 : slots.size >= 2;
			}
		} else if (!matchWinner(resolvedMatchToLogical(match))) {
			result = false;
		} else if (outcome === 'winner') {
			result = true;
		} else {
			// a bye has no loser, a played match or forfeit does
			result = rosters >= 2;
		}

		possibleOutcomes.set(key, result);
		return result;
	}

	/** The set of slots that can ever receive a team. */
	function possibleSlots(matchId: string): Set<MatchSlot> {
		const slots = new Set<MatchSlot>();

		for (const edge of graph.incomingEdges.get(matchId) ?? []) {
			if (isOutcomePossible(edge.fromId, edge.outcome)) {
				slots.add(edge.slot);
			}
		}

		return slots;
	}

	return {
		isVisible(match) {
			const feeders = graph.incomingEdges.get(match.id) ?? [];

			// Seeded first-round match: only real matches are rendered, not byes.
			if (feeders.length === 0) {
				return rosterCount(match) >= 2;
			}

			const slots = possibleSlots(match.id);
			return slots.has(MatchSlot.A) && slots.has(MatchSlot.B);
		}
	};
}

type LaneNodes = {
	upper: BracketLayoutNode[];
	lower: BracketLayoutNode[];
	grandFinal: BracketLayoutNode[];
};

function groupNodesByLane(nodes: BracketLayoutNode[]): LaneNodes {
	return {
		upper: nodes.filter((node) => bracketSideOf(node.match) === BracketSide.UPPER),
		lower: nodes.filter((node) => bracketSideOf(node.match) === BracketSide.LOWER),
		grandFinal: nodes.filter((node) => bracketSideOf(node.match) === BracketSide.GRAND_FINAL)
	};
}

/**
 * Assigns a y coordinate to every node in one lane.
 *
 * A lane is a tree, so the first round is a plain row of evenly spaced cards and
 * every later match is centred between the two matches feeding it. Walking from
 * the first round towards the final guarantees the feeders already have a y when
 * their destination is positioned.
 */
function positionLane(
	laneNodes: BracketLayoutNode[],
	context: LayoutContext,
	options: { lane: BracketSide; firstRound: number }
): void {
	const rounds = groupByRound(laneNodes);

	// Highest round first: the first round is at the left of the lane.
	for (const [round, matchesInRound] of [...rounds.entries()].sort((a, b) => b[0] - a[0])) {
		if (round === options.firstRound) {
			matchesInRound.forEach((node, index) => {
				node.y = rowY(index);
			});
			continue;
		}

		matchesInRound.forEach((node, index) => {
			const sourceYs = feederYs(node, context, options.lane);

			// Centre the match between its feeders. Falling back to row spacing
			// keeps malformed data from collapsing onto the top of the canvas.
			node.y = sourceYs.length > 0 ? average(sourceYs) : rowY(index);
		});
	}
}

/**
 * The y coordinates of the already-positioned matches feeding the given match.
 *
 * Only winner edges point at the next match. When laying out the lower lane we
 * also ignore feeders from the upper lane: those are upper-bracket drops, not
 * drawn lines, and letting their y influence the lower lane would pull lower
 * rounds out of their own tree and make the lane harder to follow.
 */
function feederYs(node: BracketLayoutNode, context: LayoutContext, lane: BracketSide): number[] {
	return (context.incomingEdges.get(node.match.id) ?? [])
		.filter((edge) => edge.outcome === 'winner')
		.filter((edge) => {
			if (lane === BracketSide.UPPER) return true;

			const source = context.matchesById.get(edge.fromId);
			return source !== undefined && bracketSideOf(source) === BracketSide.LOWER;
		})
		.map((edge) => context.nodesById.get(edge.fromId)?.y)
		.filter((y): y is number => y !== undefined);
}

function shiftLaneY(nodes: BracketLayoutNode[], offset: number): void {
	for (const node of nodes) {
		node.y += offset;
	}
}

/** Centres the grand final vertically on the rest of the bracket. */
function centerGrandFinal(nodes: BracketLayoutNode[], contentBottom: number): void {
	const y = Math.max(0, (contentBottom - MATCH_HEIGHT) / 2);

	for (const node of nodes) {
		node.y = y;
	}
}

/**
 * Converts logical columns into x coordinates.
 *
 * Only columns containing a visible card matter. Mapping them to a compact
 * 0..n-1 range removes the horizontal gap that a whole round of byes would
 * otherwise leave behind. Mutates the nodes and returns the total width.
 */
function assignXPositions(nodes: BracketLayoutNode[]): number {
	const visibleColumns = [
		...new Set(nodes.filter((node) => node.visible).map((node) => node.column))
	].sort((a, b) => a - b);

	const columnIndex = new Map(visibleColumns.map((column, index) => [column, index]));

	for (const node of nodes) {
		node.x = (columnIndex.get(node.column) ?? 0) * (MATCH_WIDTH + COLUMN_GAP);
	}

	if (visibleColumns.length === 0) {
		return 0;
	}

	return (visibleColumns.length - 1) * (MATCH_WIDTH + COLUMN_GAP) + MATCH_WIDTH;
}

/**
 * Builds the drawable winner edges between visible matches.
 */
function buildLayoutEdges(context: LayoutContext): BracketLayoutEdge[] {
	const edges: BracketLayoutEdge[] = [];

	for (const edge of context.edges) {
		if (edge.outcome !== 'winner') continue;

		const from = context.nodesById.get(edge.fromId);
		const to = context.nodesById.get(edge.toId);

		if (!from || !to || !from.visible || !to.visible) continue;

		edges.push({ from, to, path: edgePath(from, to) });
	}

	return edges;
}

/**
 * Builds an orthogonal path from the right edge of one card to the left edge of
 * another: right to the middle of the gap (midX) -> down or up -> right to the next card.
 * Returns an SVG path string that's later used in a <path> element.
 */
function edgePath(from: BracketLayoutNode, to: BracketLayoutNode): string {
	const startX = from.x + MATCH_WIDTH;
	const startY = from.y + MATCH_HALF_HEIGHT;
	const endX = to.x;
	const endY = to.y + MATCH_HALF_HEIGHT;
	const midX = Math.max(startX, endX - COLUMN_GAP / 2);

	return `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
}

/** The y coordinate of the nth card in a first-round row. */
function rowY(index: number): number {
	return index * (MATCH_HEIGHT + MATCH_GAP);
}

function groupByRound(nodes: BracketLayoutNode[]): Map<number, BracketLayoutNode[]> {
	const rounds = new Map<number, BracketLayoutNode[]>();

	for (const node of nodes) {
		const round = node.match.round ?? 0;
		const matchesInRound = rounds.get(round) ?? [];
		matchesInRound.push(node);
		rounds.set(round, matchesInRound);
	}

	return rounds;
}

function bracketSideOf(match: ResolvedMatchWithSeeds | undefined): BracketSide {
	return match?.bracketSide ?? BracketSide.UPPER;
}

function rosterCount(match: ResolvedMatchWithSeeds): number {
	return Number(match.rosterA !== null) + Number(match.rosterB !== null);
}

function maxRound(matches: ResolvedMatchWithSeeds[]): number {
	return matches.length === 0 ? 0 : Math.max(...matches.map((match) => match.round ?? 0));
}

/** The bottom edge of the lowest visible card in the given set. */
function visibleBottom(nodes: BracketLayoutNode[]): number {
	const visible = nodes.filter((node) => node.visible);

	if (visible.length === 0) {
		return 0;
	}

	return Math.max(...visible.map((node) => node.y + MATCH_HEIGHT));
}

/**
 * Whether an edge should be highlighted when the given roster is hovered anywhere in the bracket.
 * This is true if the roster "travelled" via that edge, that is if they participated in both the
 * source and destination matches of the edge.
 */
export function isEdgeHighlighted(edge: BracketLayoutEdge, rosterId: string | null): boolean {
	if (!rosterId) return false;

	return (
		isInMatch(resolvedMatchToLogical(edge.from.match), rosterId) &&
		isInMatch(resolvedMatchToLogical(edge.to.match), rosterId)
	);
}

export type PaintableBracketEdge = {
	edge: BracketLayoutEdge;
	highlighted: boolean;
};

/**
 * Computes the highlight state of every edge and orders them for painting.
 *
 * Both feeders into a match share the last horizontal segment of their path.
 * SVG paint order is document order (z-index does not apply to SVG children),
 * so highlighted edges are put last to make sure an unhighlighted line from the
 * other feeder cannot cover the highlighted segment.
 */
export function orderEdgesForPainting(
	edges: BracketLayoutEdge[],
	rosterId: string | null
): PaintableBracketEdge[] {
	const items = edges.map((edge) => ({
		edge,
		highlighted: isEdgeHighlighted(edge, rosterId)
	}));

	return [
		...items.filter((item) => !item.highlighted),
		...items.filter((item) => item.highlighted)
	];
}
