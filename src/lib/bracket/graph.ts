import type { MatchSlot } from '../types';

export type BracketEdgeOutcome = 'winner' | 'loser';

export type BracketEdge = {
	fromId: string;
	toId: string;
	outcome: BracketEdgeOutcome;
	slot: MatchSlot;
};

/** The structural links of a match within the bracket graph. */
export type BracketLinks = {
	id: string;
	nextMatchId?: string | null;
	nextSlot?: MatchSlot | null;
	loserNextMatchId?: string | null;
	loserSlot?: MatchSlot | null;
};

/**
 * Returns all graph edges between the given matches.
 *
 * This lives in its own module so the renderer can use it without pulling in
 * the generator (and its `uuid` dependency) into the public bundle.
 */
export function getBracketEdges(matches: BracketLinks[]): BracketEdge[] {
	const edges: BracketEdge[] = [];

	for (const match of matches) {
		if (match.nextMatchId && match.nextSlot) {
			edges.push({
				fromId: match.id,
				toId: match.nextMatchId,
				outcome: 'winner',
				slot: match.nextSlot
			});
		}

		if (match.loserNextMatchId && match.loserSlot) {
			edges.push({
				fromId: match.id,
				toId: match.loserNextMatchId,
				outcome: 'loser',
				slot: match.loserSlot
			});
		}
	}

	return edges;
}
