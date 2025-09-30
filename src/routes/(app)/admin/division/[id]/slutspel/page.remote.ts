import { command } from '$app/server';
import { matchSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import type { FullMatch } from '$lib/types';
import { sortBySeed, toSlug } from '$lib/util';
import { eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';

export const createGroup = command(
	z.object({
		name: z.string(),
		divisionId: z.uuidv4()
	}),
	async ({ name, divisionId }) => {
		const slug = toSlug(name.split(' ').at(-1) ?? name);

		const [group] = await db
			.insert(schema.group)
			.values({
				name,
				divisionId,
				slug
			})
			.returning();

		return { group };
	}
);

export const deleteDivision = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await db.delete(schema.division).where(eq(schema.division.id, id));
	}
);

export const generateBracket = command(
	z.object({
		divisionId: z.uuid()
	}),
	async ({ divisionId }) => {
		const { rosters, groupMatches } = await aggregateGroups(divisionId);

		sortBySeed(rosters, groupMatches);

		const numberOfRounds = Math.ceil(Math.log2(rosters.length));
		const emptySlots = Math.pow(numberOfRounds, 2) - rosters.length;

		const rounds = [];
		let order = 0;

		// create the final match
		rounds.push([createMatch(divisionId, order++)]);

		// create matches in reverse order
		for (let i = 1; i < numberOfRounds; i++) {
			const round = [];

			for (const nextMatch of rounds[i - 1]) {
				const matchA = createMatch(divisionId, order++, nextMatch.id);
				const matchB = createMatch(divisionId, order++, nextMatch.id);

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
				match.rosterBId = rosters[rosters.length - (i + numberOfRounds - emptySlots - 1)].id;
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

async function aggregateGroups(divisionId: string) {
	const data = await db.query.group.findMany({
		where: eq(schema.group.divisionId, divisionId),
		columns: {},
		with: {
			rosters: {
				columns: {
					id: true
				}
			},
			matches: {
				columns: {
					id: true,
					rosterAId: true,
					rosterBId: true,
					teamAScore: true,
					teamBScore: true,
					draws: true
				}
			}
		}
	});

	return {
		rosters: data.flatMap((group) => group.rosters),
		groupMatches: data.flatMap((group) => group.matches)
	};
}

function createMatch(divisionId: string, order: number, nextMatchId?: string): FullMatch {
	return {
		id: uuidv4(),
		nextMatchId,
		divisionId,
		played: false,
		order
	};
}

export const updateBracket = command(
	z.object({
		matches: z.array(matchSchema)
	}),
	async ({ matches }) => {
		await db.transaction(async (tx) => {
			await Promise.all(
				matches.map((match) => {
					return tx.update(schema.match).set(match).where(eq(schema.match.id, match.id));
				})
			);
		});

		console.log('saved');
	}
);

export const deleteBracket = command(
	z.object({
		divisionId: z.uuid()
	}),
	async ({ divisionId }) => {
		await db.delete(schema.match).where(eq(schema.match.divisionId, divisionId));
	}
);
