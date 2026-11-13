import {
	type LogicalMatch,
	type ResolvedMatch,
	type MatchWithoutRosters,
	MatchState,
	MatchSlot,
	type Placement,
	type UnresolvedMatch,
	type ResolvedMatchWithContext,
	type NestedDivision
} from './types';
import { v4 as uuidv4 } from 'uuid';

/** Returns an array of all possible match slots. */
export function matchSlots(): readonly MatchSlot[] {
	return [MatchSlot.A, MatchSlot.B] as const;
}

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

/** Returns the opposite of the given slot if the flip flag is true. Otherwise, returns the input slot. */
export function flipSlot(slot: MatchSlot, flip: boolean = true): MatchSlot {
	if (!flip) return slot;
	return slot === MatchSlot.A ? MatchSlot.B : MatchSlot.A;
}

/** Returns the score of a slot in a match. */
export function matchScore(match: LogicalMatch, slot: MatchSlot): number {
	if (slot === MatchSlot.A) return match.teamAScore;
	if (slot === MatchSlot.B) return match.teamBScore;
	return 0;
}

/** Returns the winning slot of a match, or null if there is no winner. */
export function matchWinner(match: LogicalMatch): MatchSlot | null {
	if (!hasMatchScore(match)) return null;

	const teamA = matchScore(match, MatchSlot.A);
	const teamB = matchScore(match, MatchSlot.B);

	if (teamA > teamB) return MatchSlot.A;
	if (teamB > teamA) return MatchSlot.B;

	return null;
}

/** Returns the roster in the given slot of a match, or null if not resolved. */
export function matchRoster<R>(
	match: { rosterA?: R | null; rosterB?: R | null },
	slot: MatchSlot
): R | null {
	return (slot === MatchSlot.A ? match.rosterA : match.rosterB) ?? null;
}

/** Returns the team note of a slot in a match, or null if none. */
export function matchNote(match: MatchWithoutRosters, slot: MatchSlot): string | null {
	return (slot === MatchSlot.A ? match.teamANote : match.teamBNote) ?? null;
}

/** Returns whether the given slot is the winner of a match. */
export function isWinner(match: LogicalMatch, slot: MatchSlot): boolean {
	const winner = matchWinner(match);
	if (!winner) return false;
	return winner === slot;
}

/** Returns the roster ID in the given slot of a match, or null if not set. */
export function matchRosterId(match: LogicalMatch, slot?: MatchSlot | null): string | null {
	if (slot === MatchSlot.A) return match.rosterAId;
	if (slot === MatchSlot.B) return match.rosterBId;
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
export function createGroupMatch(groupId: string): Required<UnresolvedMatch> {
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
		nextSlot: null,
		loserNextMatchId: null,
		loserSlot: null,
		bracketSide: null,
		round: null
	};
}

/**
 * Converts a ResolvedMatch to a LogicalMatch by flatting the roster objects to their IDs.
 */
export function resolvedMatchToLogical(match: ResolvedMatch): LogicalMatch {
	return {
		rosterAId: match.rosterA?.id ?? null,
		rosterBId: match.rosterB?.id ?? null,
		teamAScore: match.teamAScore,
		teamBScore: match.teamBScore,
		draws: match.draws,
		state: match.state
	};
}

export function getFinalMatch(
	matches: ResolvedMatchWithContext[]
): ResolvedMatchWithContext | null {
	return (
		matches
			.filter((match) => match.round != null)
			.sort((a, b) => a.round! - b.round!)
			.at(0) ?? null
	);
}

export function getRosterPlacement(
	rosterId: string,
	rosterCount: number,
	finalMatch: ResolvedMatchWithContext | null
): Placement | null {
	if (!finalMatch || finalMatch.round == null) return null;

	const round = finalMatch.round;
	const worst = Math.min(Math.pow(2, round + 1), rosterCount);

	if (finalMatch.state === MatchState.SCHEDULED) {
		return { best: 1, worst };
	}

	if (round === 0) {
		const logicalFinalMatch = resolvedMatchToLogical(finalMatch);

		// played in the grand final
		const winner = matchWinner(logicalFinalMatch);
		// grand final is undecided
		if (!winner) return { best: 1, worst: 2 };

		const place = matchRosterId(logicalFinalMatch, winner) === rosterId ? 1 : 2;
		return { best: place, worst: place };
	}

	// since we didn't win (or play) the grand final, we must have lost our final match

	const best = Math.pow(2, round) + 1;

	return { best, worst };
}

export function matchDivision(match: ResolvedMatchWithContext): NestedDivision | null {
	if (match.group) return match.group.division;
	if (match.bracket) return match.bracket.division;
	return null;
}
