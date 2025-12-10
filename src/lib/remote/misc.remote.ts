import { command } from '$app/server';
import { db, schema } from '$lib/server/db';
import { Rank, Role } from '$lib/types';
import z from 'zod';
import { adminGuard } from './auth.remote';
import { toSlug } from '$lib/util';
import { findOrCreatePlayer, type Transaction } from '$lib/server/db/helpers';

type MemberInput = {
	battletag: string;
	rank: Rank | null;
	tier: number | null;
	sr: number | null;
	role: Role;
	is_captain: boolean;
};

type RosterInput = {
	players: MemberInput[];
};

type DivisionInput = Record<string, RosterInput>;

type SeasonInput = {
	season: number;
	legacyRanks: boolean;
	divisions: Record<string, DivisionInput>;
};

export const uploadSeasonData = command(
	z.object({
		season: z.int(),
		legacyRanks: z.boolean(),
		divisions: z.record(
			z.string(),
			z.record(
				z.string(),
				z.object({
					players: z.array(
						z.object({
							battletag: z.string(),
							rank: z.enum(Rank).nullable(),
							tier: z.int().nullable(),
							sr: z.int().nullable(),
							role: z.enum(Role),
							is_captain: z.boolean()
						})
					)
				})
			)
		)
	}),
	async (input) => {
		await adminGuard();

		const { season } = await db.transaction(async (tx) => {
			return await insertSeason(tx, input);
		});

		return { season };
	}
);

async function insertSeason(tx: Transaction, input: SeasonInput) {
	const name = `Säsong ${input.season}`;

	const [season] = await tx
		.insert(schema.season)
		.values({
			name,
			slug: toSlug(name),
			startedAt: new Date(),
			legacyRanks: input.legacyRanks
		})
		.returning();

	for (const [divisionName, division] of Object.entries(input.divisions)) {
		await insertDivision(tx, season.id, season.slug, divisionName, division);
	}

	return { season };
}

async function insertDivision(
	tx: Transaction,
	seasonId: string,
	seasonSlug: string,
	name: string,
	input: DivisionInput
) {
	if (!isNaN(parseInt(name))) {
		name = `Division ${name}`;
	}

	const [division] = await tx
		.insert(schema.division)
		.values({ name, slug: toSlug(name), seasonId })
		.returning();

	const [group] = await tx
		.insert(schema.group)
		.values({ name: 'Grupp', slug: 'grupp', divisionId: division.id })
		.returning();

	for (const [rosterName, rosterInfo] of Object.entries(input)) {
		await insertRoster(tx, seasonSlug, group.id, rosterName, rosterInfo);
	}
}

async function insertRoster(
	tx: Transaction,
	seasonSlug: string,
	groupId: string,
	name: string,
	input: RosterInput
) {
	const [team] = await tx.insert(schema.team).values({}).returning();
	const [roster] = await tx
		.insert(schema.roster)
		.values({
			name,
			seasonSlug,
			slug: toSlug(name),
			teamId: team.id,
			groupId
		})
		.returning();

	for (const player of input.players) {
		const playerId = await findOrCreatePlayer(tx, player.battletag);

		await tx.insert(schema.member).values({
			rosterId: roster.id,
			playerId,
			role: player.role,
			rank: player.rank,
			tier: player.tier,
			sr: player.sr,
			isCaptain: player.is_captain
		});
	}
}
