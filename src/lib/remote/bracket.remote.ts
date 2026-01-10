import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { matchSchema } from '$lib/schemas';
import { adminGuard } from './auth.remote';
import { createBracket } from '$lib/bracket';
import { error } from '@sveltejs/kit';
import { sortBySeed } from '$lib/table';
import type { UnresolvedMatchWithOrder } from '$lib/types';
import { fullMatchColumns, matchRosterQuery } from '$lib/server/db/helpers';

export const generateBracket = command(
	z.object({
		name: z.string(),
		divisionId: z.uuid(),
		roundCount: z.number(),
		avoidPreviousMatches: z.boolean(),
		flipStandings: z.boolean()
	}),
	async ({ name, divisionId, roundCount, avoidPreviousMatches, flipStandings }) => {
		await adminGuard();

		const { groups, groupwiseStandings } = await fetchDivision(divisionId);

		const rosters = groups.flatMap((group) => group.rosters);
		const groupMatches = groups.flatMap((group) => group.matches);

		let qualifying;
		if (!groupwiseStandings) {
			// combine all groups and pick the highest seeded teams
			sortBySeed(rosters, groupMatches);
			qualifying = rosters;

			if (flipStandings) {
				qualifying.reverse();
			}
		} else {
			// determine how many rosters we need from each group
			const slots = Math.pow(2, roundCount);
			const teamsPerGroup = Math.floor(slots / groups.length);
			let extraTeams = slots % groups.length;

			for (const group of groups) {
				// seed each group individually
				sortBySeed(group.rosters, group.matches);

				if (flipStandings) {
					group.rosters.reverse();
				}
			}

			qualifying = [];
			for (const group of groups) {
				let take = teamsPerGroup;
				if (extraTeams > 0) {
					// distribute remaining slots to the first n groups
					take++;
					extraTeams--;
				}
				const selected = group.rosters.slice(0, take);
				qualifying.push(...selected);
			}

			// finally sort by overall seed by combining all groups again
			sortBySeed(qualifying, groupMatches);
		}

		const rounds = createBracket(qualifying, groupMatches, roundCount, {
			avoidPreviousMatches
		});

		const bracket = await insertBracket(name, divisionId, rounds);

		return { bracket };
	}
);

async function insertBracket(
	name: string,
	divisionId: string,
	rounds: UnresolvedMatchWithOrder[][]
) {
	return await db.transaction(async (tx) => {
		const [bracket] = await tx
			.insert(schema.bracket)
			.values({
				name,
				divisionId
			})
			.returning({
				id: schema.bracket.id
			});

		const matchInserts = rounds.flatMap((round) =>
			round.map((match) => ({
				bracketId: bracket.id,
				...match
			}))
		);

		if (matchInserts.length > 0) {
			await tx.insert(schema.match).values(matchInserts);
		}

		return bracket;
	});
}

async function fetchDivision(divisionId: string) {
	const data = await db.query.division.findFirst({
		where: {
			id: divisionId
		},
		columns: {
			playoffLine: true,
			groupwiseStandings: true
		},
		with: {
			groups: {
				columns: {},
				with: {
					rosters: matchRosterQuery,
					matches: {
						where: {
							played: true
						},
						columns: fullMatchColumns
					}
				}
			}
		}
	});

	if (!data) {
		return error(404);
	}

	return data;
}

export const updateBracket = command(
	z.object({
		id: z.uuid(),
		name: z.string(),
		matches: z.array(matchSchema)
	}),
	async ({ id, name, matches }) => {
		await adminGuard();

		await db.transaction(async (tx) => {
			await tx.update(schema.bracket).set({ name }).where(eq(schema.bracket.id, id));

			// we don't allow adding/removing matches here, just updating existing ones
			await Promise.all(
				matches.map((match) => {
					return tx.update(schema.match).set(match).where(eq(schema.match.id, match.id));
				})
			);
		});
	}
);

export const deleteBracket = command(
	z.object({
		id: z.uuid()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.bracket).where(eq(schema.bracket.id, id));
	}
);
