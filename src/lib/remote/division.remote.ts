import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { toSlug } from '$lib/util';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { matchSchema } from '$lib/schemas';
import { adminGuard } from './auth.remote';
import { createBracket } from '$lib/bracket';
import { error } from '@sveltejs/kit';
import { sortBySeed } from '$lib/table';

export const createDivision = command(
	z.object({
		name: z.string(),
		seasonId: z.uuidv4()
	}),
	async ({ name, seasonId }) => {
		await adminGuard();

		const slug = toSlug(name.split(' ').at(-1) ?? name);

		const [division] = await db
			.insert(schema.division)
			.values({
				name,
				seasonId,
				slug
			})
			.returning();

		return { division };
	}
);

export const updateDivision = command(
	z.object({
		id: z.uuid(),
		name: z.string().nonempty(),
		playoffLine: z.number().nullable(),
		groupwiseStandings: z.boolean(),
		bracketMatches: z.array(matchSchema)
	}),
	async ({ id, name, playoffLine, groupwiseStandings, bracketMatches }) => {
		await adminGuard();

		await db.transaction(async (tx) => {
			const slug = toSlug(name.split(' ').at(-1) ?? name);

			await tx
				.update(schema.division)
				.set({ slug, name, playoffLine, groupwiseStandings })
				.where(eq(schema.division.id, id));

			await Promise.all(
				bracketMatches.map((match) => {
					return tx.update(schema.match).set(match).where(eq(schema.match.id, match.id));
				})
			);
		});
	}
);

export const deleteDivision = command(
	z.object({
		id: z.uuidv4()
	}),
	async ({ id }) => {
		await adminGuard();

		await db.delete(schema.division).where(eq(schema.division.id, id));
	}
);

export const generateBracket = command(
	z.object({
		divisionId: z.uuid(),
		rosterDivisionId: z.uuid().optional(),
		roundCount: z.number(),
		avoidPreviousMatches: z.boolean(),
		flipStandings: z.boolean()
	}),
	async ({
		divisionId,
		roundCount,
		avoidPreviousMatches,
		flipStandings,
		rosterDivisionId = divisionId
	}) => {
		await adminGuard();

		const { rosters, groupMatches, playoffLine } = await aggregateGroupsIn(rosterDivisionId);
		sortBySeed(rosters, groupMatches);

		const qualifying = rosters.slice(0, playoffLine ?? undefined);

		if (flipStandings) {
			qualifying.reverse();
		}

		const rounds = createBracket(qualifying, groupMatches, roundCount, {
			avoidPreviousMatches
		});

		const matchInserts = rounds.flatMap((round) =>
			round.map((match) => ({
				divisionId,
				...match
			}))
		);
		if (matchInserts.length > 0) {
			await db.insert(schema.match).values(matchInserts);
		}

		return { rounds };
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

export const deleteBracket = command(
	z.object({
		divisionId: z.uuid()
	}),
	async ({ divisionId }) => {
		await adminGuard();

		await db.delete(schema.match).where(eq(schema.match.divisionId, divisionId));
	}
);
