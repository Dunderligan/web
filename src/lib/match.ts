import {
	type LogicalMatch,
	type MatchRoster,
	type ResolvedMatch,
	type MatchWithoutRosters,
	MatchState,
	type Placement,
	type UnresolvedMatch
} from './types';
import { v4 as uuidv4 } from 'uuid';

/** Whether a match has a recorded score, that is, a score that should count toward the teams' standings. */
export function hasMatchScore(match: LogicalMatch): boolean {
	return match.state === MatchState.PLAYED || match.state === MatchState.WALKOVER;
}

/** Check if a match is played between two rosters */
export function isMatchBetween(match: LogicalMatch, aId: string, bId: string): boolean {
	return isInMatch(match, aId) && isInMatch(match, bId);
}

/** Check whether a roster is part of a match. */
export function isInMatch(match: LogicalMatch, rosterId: string): boolean {
	return match.rosterAId === rosterId || match.rosterBId === rosterId;
}

/**
 * One logical side of a match.
 * The tournament does not have a concept of "home" or "away" teams, instead
 * "A" is usually displayed as the leftmost/top team, whereas "B" is the other.
 */
export type MatchSide = 'A' | 'B';

/** Returns the opposite of the given side if the flip flag is true. Otherwise, returns the input side. */
export function flipSide(side: MatchSide, flip: boolean = true): MatchSide {
	if (!flip) return side;
	return side === 'A' ? 'B' : 'A';
}

/** Returns the score of a side in a match. */
export function matchScore(match: LogicalMatch, side: MatchSide): number {
	if (side === 'A') return match.teamAScore;
	if (side === 'B') return match.teamBScore;
	return 0;
}

/** Returns the winning side of a match, or null if there is no winner. */
export function matchWinner(match: LogicalMatch): MatchSide | null {
	if (!hasMatchScore(match)) return null;

	const teamA = matchScore(match, 'A');
	const teamB = matchScore(match, 'B');

	if (teamA > teamB) return 'A';
	if (teamB > teamA) return 'B';

	return null;
}

/** Returns the roster on the given side of a match, or null if not resolved. */
export function matchRoster<R>(
	match: { rosterA?: R | null; rosterB?: R | null },
	side: MatchSide
): R | null {
	return (side === 'A' ? match.rosterA : match.rosterB) ?? null;
}

/** Returns the team note of a side in a match, or null if none. */
export function matchNote(match: MatchWithoutRosters, side: MatchSide): string | null {
	return (side === 'A' ? match.teamANote : match.teamBNote) ?? null;
}

/** Returns whether the given side is the winner of a match. */
export function isWinner(match: LogicalMatch, side: MatchSide): boolean {
	const winner = matchWinner(match);
	if (!winner) return false;
	return winner === side;
}

/** Returns the roster ID on the given side of a match, or null if not set. */
export function matchRosterId(match: LogicalMatch, side?: MatchSide | null): string | null {
	if (side === 'A') return match.rosterAId ?? null;
	if (side === 'B') return match.rosterBId ?? null;
	return null;
}

/**
 * Compares two matches by their played or scheduled dates, most recent first.
 * This should mimic the SQL ordering function in $lib/server/db/helpers.ts, and is used
 * whenever matches need to be sorted outside of database queries.
 */
export function compareMatchDates(a: MatchWithoutRosters, b: MatchWithoutRosters): number {
	if (a.playedAt && b.playedAt) {
		return b.playedAt.getTime() - a.playedAt.getTime();
	}

	if (a.playedAt) return -1;
	if (b.playedAt) return 1;

	if (a.scheduledAt && b.scheduledAt) {
		return a.scheduledAt.getTime() - b.scheduledAt.getTime();
	}

	if (a.scheduledAt) return -1;
	if (b.scheduledAt) return 1;

	return 0;
}

/**
 * Creates a new, unresolved and scheduled match with default values for a group.
 */
export function createGroupMatch(groupId: string): UnresolvedMatch {
	return {
		id: uuidv4(),
		groupId,
		bracketId: null,
		rosterAId: null,
		rosterBId: null,
		teamAScore: 0,
		teamBScore: 0,
		draws: 0,
		teamANote: null,
		teamBNote: null,
		state: MatchState.SCHEDULED,
		playedAt: null,
		scheduledAt: null,
		vodUrl: null,
		nextMatchId: null,
		round: null
	};
}

export function placementFromFinalMatch(match: ResolvedMatch, rosterId: string): Placement | null {
	const round = match.round;
	if (round === null || round === undefined) {
		// no round means the match is in a group stage, so we can't determine placement
		return null;
	}

	if (match.state === MatchState.SCHEDULED) {
		return null;
	}

	if (round === 0) {
		// played in the grand final
		const winner = matchWinner(match);
		if (!winner) return { best: 1, worst: 2 };

		const place = matchRosterId(match, winner) === rosterId ? 1 : 2;
		return { best: place, worst: null };
	}

	// since we didn't win (or play) the grand final, we lost this match

	const best = Math.pow(2, round) + 1;
	const worst = Math.pow(2, round + 1);

	return { best, worst };
}
