import type { LogicalMatch, MatchRoster, ResolvedMatch, MatchWithoutRosters } from './types';

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

export function matchScore(match: LogicalMatch, side: MatchSide): number {
	if (side === 'A') return match.teamAScore ?? null;
	if (side === 'B') return match.teamBScore ?? null;
	return 0;
}

export function matchWinner(match: LogicalMatch): MatchSide | null {
	if (!match.played) return null;

	const teamA = matchScore(match, 'A');
	const teamB = matchScore(match, 'B');

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

export function getRosterId(match: LogicalMatch, side?: MatchSide | null): string | null {
	if (side === 'A') return match.rosterAId ?? null;
	if (side === 'B') return match.rosterBId ?? null;
	return null;
}

export function compareMatchDates(a: MatchWithoutRosters, b: MatchWithoutRosters): number {
	const aDate = a.playedAt ?? a.scheduledAt;
	const bDate = b.playedAt ?? b.scheduledAt;

	if (aDate && bDate) {
		return bDate.getTime() - aDate.getTime();
	}

	if (aDate) return -1;
	if (bDate) return 1;

	return 0;
}
