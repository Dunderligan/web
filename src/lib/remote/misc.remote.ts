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

type MatchInput = {
	date: Date;
	rosterA: string;
	rosterB: string;
	teamAScore: number;
	teamBScore: number;
	draws: number;
};

type GroupInput = {
	rosters: Record<string, RosterInput>;
	matches: MatchInput[];
};

type DivisionInput = Record<string, GroupInput>;

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
					rosters: z.record(
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
					),
					matches: z.array(
						z.object({
							date: z.date(),
							rosterA: z.string(),
							rosterB: z.string(),
							teamAScore: z.int(),
							teamBScore: z.int(),
							draws: z.int()
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
	const [division] = await tx
		.insert(schema.division)
		.values({ name, slug: toSlug(name), seasonId })
		.returning();

	for (const [groupName, group] of Object.entries(input)) {
		await insertGroup(tx, seasonSlug, division.id, groupName, group);
	}
}

async function insertGroup(
	tx: Transaction,
	seasonSlug: string,
	divisionId: string,
	name: string,
	input: GroupInput
) {
	const [group] = await tx
		.insert(schema.group)
		.values({ name, slug: toSlug(name), divisionId })
		.returning();

	let rosterMap: Record<string, string> = {};
	for (const [rosterName, rosterInput] of Object.entries(input.rosters)) {
		const { roster } = await insertRoster(tx, seasonSlug, group.id, rosterName, rosterInput);
		rosterMap[rosterName] = roster.id;
	}

	for (const matchInput of input.matches) {
		await tx.insert(schema.match).values({
			scheduledAt: matchInput.date,
			playedAt: matchInput.date,
			played: true,
			groupId: group.id,
			rosterAId: rosterMap[matchInput.rosterA],
			rosterBId: rosterMap[matchInput.rosterB],
			teamAScore: matchInput.teamAScore,
			teamBScore: matchInput.teamBScore,
			draws: matchInput.draws
		});
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

	return { roster };
}
