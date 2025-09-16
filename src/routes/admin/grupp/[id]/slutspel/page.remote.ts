import { command, getRequestEvent } from '$app/server';
import { db, schema } from '$lib/server/db';
import { MatchType } from '$lib/types';
import { sortBySeed } from '$lib/util';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';

export const generateBracket = command(
	z.object({
		groupId: z.uuid()
	}),
	async ({ groupId }) => {
		const rosters = await db.query.roster.findMany({
			where: eq(schema.roster.groupId, groupId),
			columns: {
				id: true
			}
		});

		const groupMatches = await db.query.match.findMany({
			where: and(eq(schema.match.groupId, groupId), eq(schema.match.type, MatchType.GROUP)),
			columns: {
				id: true,
				rosterAId: true,
				rosterBId: true,
				teamAScore: true,
				teamBScore: true,
				draws: true
			}
		});

		sortBySeed(rosters, groupMatches);

		const numberOfRounds = Math.ceil(Math.log2(rosters.length));
		const emptySlots = Math.pow(numberOfRounds, 2) - rosters.length;

		const rounds = [];

		// create the final match
		rounds.push([createMatch(groupId)]);

		// create matches in reverse order
		for (let i = 1; i < numberOfRounds; i++) {
			const round = [];

			for (const nextMatch of rounds[i - 1]) {
				const matchA = createMatch(groupId, nextMatch.id);
				const matchB = createMatch(groupId, nextMatch.id);

				round.push(matchA);
				round.push(matchB);
			}

			rounds.push(round);
		}

		const firstRound = rounds[rounds.length - 1];

		// populate first round with teams
		for (let i = 0; i < firstRound.length; i++) {
			const match = firstRound[i];
			match.rosterAId = rosters[i].id;

			if (i >= emptySlots - 1) {
				match.rosterBId = rosters[rosters.length - i + emptySlots - 2].id;
			} else {
				// other slot is empty; automatically promote team
				match.played = true;
				match.teamAScore = 3;

				const nextRound = rounds[rounds.length - 2];
				const nextMatch = nextRound[Math.floor(i / 2)];

				if (nextMatch.rosterAId) {
					nextMatch.rosterBId = rosters[i].id;
				} else {
					nextMatch.rosterAId = rosters[i].id;
				}
			}
		}

		rounds.reverse();

		const matches = rounds.flatMap((round) => round);
		await db.insert(schema.match).values(matches);

		return { rounds };
	}
);

function createMatch(groupId: string, nextMatchId?: string): typeof schema.match.$inferInsert {
	return {
		id: uuidv4(),
		nextMatchId,
		groupId,
		type: MatchType.BRACKET
	};
}

export const updateBracket = command(
	z.object({
		matches: z.array(
			z.object({
				id: z.uuid(),
				rosterAId: z.string().nullable(),
				rosterBId: z.string().nullable(),
				teamAScore: z.int().nullable(),
				teamBScore: z.int().nullable(),
				draws: z.int().nullable()
			})
		)
	}),
	async ({ matches }) => {
		await db.transaction(async (tx) => {
			await Promise.all(
				matches.map((match) =>
					tx.update(schema.match).set(match).where(eq(schema.match.id, match.id))
				)
			);
		});
	}
);

export const deleteBracket = command(
	z.object({
		groupId: z.uuid()
	}),
	async ({ groupId }) => {
		await db
			.delete(schema.match)
			.where(and(eq(schema.match.groupId, groupId), eq(schema.match.type, MatchType.BRACKET)));
	}
);
