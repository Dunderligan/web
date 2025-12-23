import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { matchSchema } from '$lib/schemas';
import { adminGuard } from './auth.remote';
import { createBracket } from '$lib/bracket';
import { error } from '@sveltejs/kit';
import { sortBySeed } from '$lib/table';

export const generateBracket = command(
	z.object({
		name: z.string().nullable(),
		divisionId: z.uuid(),
		roundCount: z.number(),
		avoidPreviousMatches: z.boolean(),
		flipStandings: z.boolean()
	}),
	async ({ name, divisionId, roundCount, avoidPreviousMatches, flipStandings }) => {
		await adminGuard();

		const { rosters, groupMatches, playoffLine } = await aggregateGroupsIn(divisionId);
		sortBySeed(rosters, groupMatches);

		const qualifying = rosters.slice(0, playoffLine ?? undefined);

		if (flipStandings) {
			qualifying.reverse();
		}

		const rounds = createBracket(qualifying, groupMatches, roundCount, {
			avoidPreviousMatches
		});

		const bracket = await db.transaction(async (tx) => {
			const [bracket] = await tx
				.insert(schema.bracket)
				.values({
					divisionId,
					name
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

		return { bracket };
	}
);

async function aggregateGroupsIn(divisionId: string) {
	const data = await db.query.division.findFirst({
		where: {
			id: divisionId
		},
		columns: {
			playoffLine: true
		},
		with: {
			groups: {
				columns: {},
				with: {
					rosters: {
						columns: {
							id: true,
							name: true
						}
					},
					matches: {
						where: {
							played: true
						},
						columns: {
							id: true,
							rosterAId: true,
							rosterBId: true,
							teamAScore: true,
							teamBScore: true,
							draws: true,
							played: true
						}
					}
				}
			}
		}
	});

	if (!data) {
		error(404);
	}

	return {
		playoffLine: data.playoffLine,
		rosters: data?.groups.flatMap((group) => group.rosters),
		groupMatches: data?.groups.flatMap((group) => group.matches)
	};
}

export const updateBracket = command(
	z.object({
		id: z.uuid(),
		name: z.string().nullable(),
		matches: z.array(matchSchema)
	}),
	async ({ id, name, matches }) => {
		await adminGuard();

		await db.transaction(async (tx) => {
			await tx.update(schema.bracket).set({ name }).where(eq(schema.bracket.id, id));

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
