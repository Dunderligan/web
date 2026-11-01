import { v4 as uuidv4 } from 'uuid';
import {
	type LogicalMatch,
	type UnresolvedMatchWithOrder,
	BracketFormat,
	BracketSide,
	MatchSlot,
	MatchState
} from '../types';
import { flipSlot, isMatchBetween, matchRosterId, matchWinner } from '../match';
import { getBracketEdges, type BracketEdgeOutcome, type BracketLinks } from './graph';

export type BracketOptions = {
	avoidPreviousMatchups: boolean;
	format: BracketFormat;
};

export type BracketStructure<T> = {
	upper: T[][];
	lower: T[][];
	grandFinal: T[];
};

/** Returns the minimum number of rounds needed in a bracket to accommodate a number of teams. */
export function minBracketRounds(teamCount: number): number {
	if (teamCount < 2) {
		return 0;
	}
	return Math.ceil(Math.log2(teamCount));
}

/**
 * Generates a bracket structure based on the seeds given by the order of the rosters array.
 *
 * Single-elimination brackets consist of an upper bracket only, while double-elimination
 * brackets add a lower bracket and a grand final. The returned matches form a graph where
 * `nextMatchId` points to the winner's next match and `loserNextMatchId` points to the
 * loser's next match (lower bracket).
 *
 * If there are more rosters than slots in the bracket, the lowest seeded rosters are ignored.
 * If there are fewer rosters than slots, some rosters will get a bye in the first round.
 */
export function createBracket<R extends { id: string }, M extends LogicalMatch>(
	rosters: R[],
	matches: M[],
	roundCount: number,
	options: BracketOptions = {
		avoidPreviousMatchups: true,
		format: BracketFormat.SINGLE_ELIMINATION
	}
): UnresolvedMatchWithOrder[] {
	const isDouble = options.format === BracketFormat.DOUBLE_ELIMINATION;

	if (isDouble && roundCount < 2) {
		throw new Error('Double elimination requires at least 2 rounds');
	}

	let order = 0;

	// The grand final is created first so the upper and lower finals can link to it.
	const grandFinal = isDouble
		? createMatch({
				order: order++,
				round: 0,
				bracketSide: BracketSide.GRAND_FINAL
			})
		: null;

	const upper = createUpperBracket(roundCount, isDouble, () => order++);

	if (grandFinal) {
		const upperFinal = upper[upper.length - 1][0];
		linkWinner(upperFinal, grandFinal, MatchSlot.A);
	}

	const lower = isDouble ? createLowerBracket(roundCount, upper, () => order++) : [];

	if (grandFinal && lower.length > 0) {
		const lowerFinal = lower[lower.length - 1][0];
		linkWinner(lowerFinal, grandFinal, MatchSlot.B);
	}

	const all = [...(grandFinal ? [grandFinal] : []), ...upper.flat(), ...lower.flat()];

	seedFirstRound(upper[0], rosters, matches, roundCount, options);
	propagateBracket(all);

	return all.sort((a, b) => a.order - b.order);
}

/**
 * Builds the upper bracket, returning the rounds from the first round to the final.
 * Match `round` is the distance from the end of the bracket: 0 for a single-elimination
 * final, 1 for the upper final of a double-elimination bracket.
 */
function createUpperBracket(
	roundCount: number,
	hasGrandFinal: boolean,
	nextOrder: () => number
): UnresolvedMatchWithOrder[][] {
	const rounds: UnresolvedMatchWithOrder[][] = [];

	// build from the final backwards, so that feeder order matches slot order
	rounds.push([
		createMatch({
			order: nextOrder(),
			round: hasGrandFinal ? 1 : 0,
			bracketSide: BracketSide.UPPER
		})
	]);

	for (let laneRound = 1; laneRound < roundCount; laneRound++) {
		const round: UnresolvedMatchWithOrder[] = [];

		for (const nextMatch of rounds[laneRound - 1]) {
			const matchA = createMatch({
				order: nextOrder(),
				round: laneRound + (hasGrandFinal ? 1 : 0),
				bracketSide: BracketSide.UPPER
			});
			const matchB = createMatch({
				order: nextOrder(),
				round: laneRound + (hasGrandFinal ? 1 : 0),
				bracketSide: BracketSide.UPPER
			});

			linkWinner(matchA, nextMatch, MatchSlot.A);
			linkWinner(matchB, nextMatch, MatchSlot.B);

			round.push(matchA, matchB);
		}

		rounds.push(round);
	}

	return rounds.reverse();
}

/**
 * Builds the lower bracket, returning the rounds from the first round to the lower final.
 * The number of rounds is `2 * (roundCount - 1)`.
 */
function createLowerBracket(
	roundCount: number,
	upper: UnresolvedMatchWithOrder[][],
	nextOrder: () => number
): UnresolvedMatchWithOrder[][] {
	const roundTotal = 2 * (roundCount - 1);
	const slots = Math.pow(2, roundCount);
	const rounds: UnresolvedMatchWithOrder[][] = [];

	for (let lowerRound = 1; lowerRound <= roundTotal; lowerRound++) {
		const count = slots / Math.pow(2, Math.floor((lowerRound + 1) / 2) + 1);
		const round: UnresolvedMatchWithOrder[] = [];

		for (let i = 0; i < count; i++) {
			round.push(
				createMatch({
					order: nextOrder(),
					round: roundTotal - lowerRound + 1,
					bracketSide: BracketSide.LOWER
				})
			);
		}

		rounds.push(round);
	}

	const firstRound = rounds[0];

	// the losers of the first upper round open the lower bracket
	for (let i = 0; i < firstRound.length; i++) {
		linkLoser(upper[0][i * 2], firstRound[i], MatchSlot.A);
		linkLoser(upper[0][i * 2 + 1], firstRound[i], MatchSlot.B);
	}

	for (let lowerRound = 2; lowerRound <= roundTotal; lowerRound++) {
		const round = rounds[lowerRound - 1];
		const previous = rounds[lowerRound - 2];

		if (lowerRound % 2 === 1) {
			// minor round: pair the winners of the previous lower round
			for (let i = 0; i < round.length; i++) {
				linkWinner(previous[i * 2], round[i], MatchSlot.A);
				linkWinner(previous[i * 2 + 1], round[i], MatchSlot.B);
			}
		} else {
			// major round: lower-bracket winners meet losers dropping from the upper bracket
			const upperRound = upper[lowerRound / 2];

			for (let i = 0; i < round.length; i++) {
				linkWinner(previous[i], round[i], MatchSlot.A);
				linkLoser(upperRound[i], round[i], MatchSlot.B);
			}
		}
	}

	return rounds;
}

/** Fills the first round according to seeding and marks byes for the top seeds. */
function seedFirstRound<R extends { id: string }, M extends LogicalMatch>(
	firstRound: UnresolvedMatchWithOrder[],
	rosters: R[],
	matches: M[],
	roundCount: number,
	options: BracketOptions
) {
	const slots = Math.pow(2, roundCount);
	let emptySlots = slots - rosters.length;

	// don't mutate the original rosters array
	rosters = [...rosters];

	if (rosters.length > slots) {
		// some teams don't proceed
		rosters = rosters.slice(0, slots);
	}

	// fill the first round according to seeding
	const matchOrder = getMatchOrder(roundCount);

	for (const matchIndex of matchOrder) {
		if (rosters.length === 0) break;
		const match = firstRound[matchIndex];

		const rosterA = rosters.shift()!;
		match.rosterAId = rosterA.id;

		if (emptySlots > 0) {
			emptySlots--;

			// automatically advance this roster
			match.state = MatchState.WALKOVER;
			match.teamAScore = 3;

			continue;
		}

		let found = false;

		// find the lowest seeded viable opponent
		for (let i = rosters.length - 1; i >= 0; i--) {
			const otherRoster = rosters[i];

			// if they have played each other in the group stage, skip
			if (
				options.avoidPreviousMatchups &&
				matches.some((match) => isMatchBetween(match, rosterA.id, otherRoster.id))
			) {
				continue;
			}

			const [rosterB] = rosters.splice(i, 1);
			match.rosterBId = rosterB.id;
			found = true;
			break;
		}

		if (found) continue;

		// if no valid opponent found, fall back to the next in line
		const rosterB = rosters.shift();
		if (rosterB) {
			match.rosterBId = rosterB.id;
		} else {
			// this should never happen
			throw new Error('Not enough rosters to fill the bracket');
		}
	}
}

function createMatch(args: {
	order: number;
	round: number;
	bracketSide: BracketSide;
}): UnresolvedMatchWithOrder {
	return {
		id: uuidv4(),
		nextMatchId: null,
		nextSlot: null,
		loserNextMatchId: null,
		loserSlot: null,
		bracketSide: args.bracketSide,
		order: args.order,
		round: args.round,
		state: MatchState.SCHEDULED,
		teamAScore: 0,
		teamBScore: 0,
		draws: 0,
		rosterAId: null,
		rosterBId: null
	};
}

function linkWinner(from: UnresolvedMatchWithOrder, to: UnresolvedMatchWithOrder, slot: MatchSlot) {
	from.nextMatchId = to.id;
	from.nextSlot = slot;
}

function linkLoser(from: UnresolvedMatchWithOrder, to: UnresolvedMatchWithOrder, slot: MatchSlot) {
	from.loserNextMatchId = to.id;
	from.loserSlot = slot;
}

/** Get the order of which matches in the first round of the bracket should be visited.
 * E.g. for 8 teams, the order is [0, 2, 3, 1]
 * This ensures that the highest seeded teams don't meet until the later rounds.
 */
function getMatchOrder(rounds: number): number[] {
	let round = [0];
	for (let i = 0; i < rounds - 1; i++) {
		round = nextRound(round);
	}

	// we now have an array of match order where each index represents which
	// order the match at that index should be visited

	// we need to convert it to an a array where the value is the match index,
	// and the index is the order

	// example for 8 teams (4 matches):

	// round = [0, 3, 1, 2]
	// - visit match 0 at #0, match 1 at #3, match 2 at #2, match 3 at #1
	// => to:
	// index order = [0, 2, 3, 1]
	// - visit match 0, then 2, 3, 1
	const visitOrder = round
		.map((matchIndex, visitIndex) => [matchIndex, visitIndex])
		.sort((a, b) => a[0] - b[0]) // sort by match index
		.map((a) => a[1]); // take the visit index

	return visitOrder;

	function nextRound(lastRound: number[]): number[] {
		const nextRound: number[] = [];
		const newLength = lastRound.length * 2 - 1;

		for (const item of lastRound) {
			nextRound.push(item);
			nextRound.push(newLength - item);
		}

		return nextRound;
	}
}

/** A match that can be part of the bracket graph. */
export type BracketMatch = LogicalMatch & BracketLinks;

type ResolvedInput = { kind: 'team'; rosterId: string } | { kind: 'empty' } | { kind: 'pending' };

const EMPTY: ResolvedInput = { kind: 'empty' };
const PENDING: ResolvedInput = { kind: 'pending' };

/**
 * Recomputes the rosters of every match from the results of the matches feeding into it.
 *
 * Pending results leave a slot as TBD, byes and empty matches resolve to no team, and
 * matches with a recorded result keep their score while their rosters are overwritten.
 * The propagation runs until the graph is stable, which resolves chains of byes in one call.
 */
export function propagateBracket<T extends BracketMatch>(matches: T[]): void {
	const byId = new Map(matches.map((match) => [match.id, match]));

	for (let pass = 0; pass <= matches.length; pass++) {
		const incoming = buildInputs(matches, byId);

		let changed = false;
		for (const match of matches) {
			const slots = incoming.get(match.id);
			if (!slots) continue;

			if (applyInputs(match, slots)) {
				changed = true;
			}
		}

		if (!changed) break;
	}
}

function buildInputs(matches: BracketMatch[], byId: Map<string, BracketMatch>) {
	const incoming = new Map<string, Partial<Record<MatchSlot, ResolvedInput>>>();

	for (const edge of getBracketEdges(matches)) {
		const source = byId.get(edge.fromId);
		if (!source) continue;

		const slots = incoming.get(edge.toId) ?? {};
		slots[edge.slot] = resolveOutcome(source, edge.outcome);
		incoming.set(edge.toId, slots);
	}

	return incoming;
}

function resolveOutcome(match: BracketMatch, outcome: BracketEdgeOutcome): ResolvedInput {
	if (match.state === MatchState.SCHEDULED) {
		return PENDING;
	}

	const winner = matchWinner(match);
	if (!winner) {
		return EMPTY;
	}

	const slot = outcome === 'winner' ? winner : flipSlot(winner);
	const rosterId = matchRosterId(match, slot);

	return rosterId ? { kind: 'team', rosterId } : EMPTY;
}

/** Whether the match has a result that should be kept when the bracket is propagated. */
function hasRecordedResult(match: BracketMatch): boolean {
	return (
		match.state === MatchState.PLAYED ||
		match.state === MatchState.CANCELLED ||
		(match.state === MatchState.WALKOVER && !!match.rosterAId && !!match.rosterBId)
	);
}

/** Writes the resolved inputs to a match and updates its state if it has no recorded result. */
function applyInputs(
	match: BracketMatch,
	slots: Partial<Record<MatchSlot, ResolvedInput>>
): boolean {
	// slots without an incoming edge are treated as pending, so that seeded matches
	// are never mistaken for byes
	const inputA = slots[MatchSlot.A] ?? PENDING;
	const inputB = slots[MatchSlot.B] ?? PENDING;

	const rosterAId = inputA.kind === 'team' ? inputA.rosterId : null;
	const rosterBId = inputB.kind === 'team' ? inputB.rosterId : null;

	const hasPending = inputA.kind === 'pending' || inputB.kind === 'pending';

	let state = match.state;
	let teamAScore = match.teamAScore;
	let teamBScore = match.teamBScore;

	if (!hasRecordedResult(match)) {
		if (hasPending || (rosterAId && rosterBId)) {
			state = MatchState.SCHEDULED;
			teamAScore = 0;
			teamBScore = 0;
		} else {
			// no feeder can produce another team, so this match is a bye (or empty)
			state = MatchState.WALKOVER;
			teamAScore = rosterAId ? 3 : 0;
			teamBScore = rosterBId ? 3 : 0;
		}
	}

	const changed =
		match.rosterAId !== rosterAId ||
		match.rosterBId !== rosterBId ||
		match.state !== state ||
		match.teamAScore !== teamAScore ||
		match.teamBScore !== teamBScore;

	match.rosterAId = rosterAId;
	match.rosterBId = rosterBId;

	if (!hasRecordedResult(match)) {
		match.state = state;
		match.teamAScore = teamAScore;
		match.teamBScore = teamBScore;
	}

	return changed;
}

/**
 * Groups a flat list of bracket matches into upper and lower bracket rounds plus the
 * grand final. Rounds are ordered from the first round to the final, and matches within
 * a round are ordered by their creation order.
 */
export function buildBracketStructure<
	T extends {
		id: string;
		bracketSide?: BracketSide | null;
		round?: number | null;
		order?: number;
	}
>(matches: T[]): BracketStructure<T> {
	const groups = new Map<BracketSide, Map<number, T[]>>();

	for (const match of matches) {
		if (match.round == null) continue;

		const side = match.bracketSide ?? BracketSide.UPPER;
		const rounds = groups.get(side) ?? new Map<number, T[]>();
		const round = rounds.get(match.round) ?? [];

		round.push(match);
		rounds.set(match.round, round);
		groups.set(side, rounds);
	}

	return {
		upper: groupRounds(groups.get(BracketSide.UPPER)),
		lower: groupRounds(groups.get(BracketSide.LOWER)),
		grandFinal: [...(groups.get(BracketSide.GRAND_FINAL)?.values() ?? [])].flat().sort(byOrder)
	};
}

function groupRounds<T extends { order?: number }>(rounds: Map<number, T[]> | undefined): T[][] {
	if (!rounds) return [];

	return [...rounds.entries()]
		.sort(([roundA], [roundB]) => roundB - roundA)
		.map(([, matches]) => matches.sort(byOrder));
}

function byOrder(a: { order?: number }, b: { order?: number }) {
	return (a.order ?? 0) - (b.order ?? 0);
}
