import type { LogicalMatch, MatchRoster, ResolvedMatch } from './types';

/** Check if a match is played between two rosters */
export function isMatchBetween(match: LogicalMatch, aId: string, bId: string): boolean {
	return isInMatch(match, aId) && isInMatch(match, bId);
}

export function isInMatch(match: LogicalMatch, rosterId: string): boolean {
	return match.rosterAId === rosterId || match.rosterBId === rosterId;
}

export type MatchSide = 'A' | 'B';

export function flipSide(side: MatchSide, flip: boolean = true): MatchSide {
	if (!flip) return side;
	return side === 'A' ? 'B' : 'A';
}

export function matchScore(match: LogicalMatch, side: MatchSide): number | null {
	if (side === 'A') return match.teamAScore ?? null;
	if (side === 'B') return match.teamBScore ?? null;
	return null;
}

export function matchScoreOrZero(match: LogicalMatch, side: MatchSide): number {
	return matchScore(match, side) ?? 0;
}

export function matchWinner(match: LogicalMatch): MatchSide | null {
	if (!match.played) return null;

	const teamA = matchScoreOrZero(match, 'A');
	const teamB = matchScoreOrZero(match, 'B');

	if (teamA > teamB) return 'A';
	if (teamB > teamA) return 'B';

	return null;
}

export function matchRoster(match: ResolvedMatch, side: MatchSide): MatchRoster | null {
	return (side === 'A' ? match.rosterA : match.rosterB) ?? null;
}

export function isWinner(match: LogicalMatch, side: MatchSide): boolean {
	const winner = matchWinner(match);
	if (!winner) return false;
	return winner === side;
}
