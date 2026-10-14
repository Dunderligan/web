import {
	MatchState,
	type LogicalMatch,
	type MatchRoster,
	type ResolvedMatchWithContext
} from '$lib/types';

/**
 * Builds a LogicalMatch with sensible defaults.
 * Defaults to a PLAYED match, so its score counts unless overridden.
 */
export function logicalMatch(partial: Partial<LogicalMatch> = {}): LogicalMatch {
	return {
		teamAScore: 0,
		teamBScore: 0,
		draws: 0,
		state: MatchState.PLAYED,
		rosterAId: null,
		rosterBId: null,
		...partial
	};
}

/** A roster as consumed by the standings calculations. */
export function roster(id: string, resigned = false): { id: string; resigned: boolean } {
	return { id, resigned };
}

/** A resolved match (with roster objects) as consumed by getRosterPlacement. */
export function resolvedMatch(
	partial: Partial<ResolvedMatchWithContext> = {}
): ResolvedMatchWithContext {
	return {
		id: 'match',
		teamAScore: 0,
		teamBScore: 0,
		draws: 0,
		state: MatchState.SCHEDULED,
		rosterA: null,
		rosterB: null,
		...partial
	};
}

/** A minimal roster object as nested inside a resolved match. */
export function matchRoster(id: string): MatchRoster {
	return { id, name: id, slug: id };
}
