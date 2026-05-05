import { command, query } from '$app/server';
import { db, schema } from '$lib/server/db';
import { MatchState, Rank, Role } from '$lib/types';
import z from 'zod';
import { roleGuard } from './auth.remote';
import { AuthRole } from '$lib/authRole';
import { flattenGroup, toSlug } from '$lib/util';
import {
	entityQuery,
	findOrCreatePlayer,
	nestedGroupQuery,
	type Transaction
} from '$lib/server/db/helpers';
import type { DrizzleError } from 'drizzle-orm';

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
	date: string;
	rosterA: string;
	rosterB: string;
	teamAScore: number;
	teamBScore: number;
	draws: number;
};

type GroupInput = {
	teams: Record<string, RosterInput>;
	matches: MatchInput[];
};

type DivisionInput = {
	groups: Record<string, GroupInput>;
};

type SeasonInput = {
	season: number;
	legacy_ranks: boolean;
	start_date: string;
	divisions: Record<string, DivisionInput>;
};

export const uploadSeasonData = command(
	z.object({
		season: z.int(),
		legacy_ranks: z.boolean(),
		start_date: z.string(),
		divisions: z.record(
			z.string(),
			z.object({
				groups: z.record(
					z.string(),
					z.object({
						teams: z.record(
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
								date: z.string(),
								rosterA: z.string(),
								rosterB: z.string(),
								teamAScore: z.int(),
								teamBScore: z.int(),
								draws: z.int()
							})
						)
					})
				)
			})
		)
	}),
	async (input) => {
		await roleGuard(AuthRole.ADMIN);

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
			startedAt: new Date(input.start_date),
			legacyRanks: input.legacy_ranks
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
	const slug = toSlug(name.split(' ').at(-1) ?? name);

	const [division] = await tx.insert(schema.division).values({ name, slug, seasonId }).returning();

	for (const [groupName, group] of Object.entries(input.groups)) {
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
	for (const [teamName, teamInput] of Object.entries(input.teams)) {
		const { roster } = await insertRoster(tx, group.id, teamName, teamInput);
		rosterMap[teamName] = roster.id;
	}

	for (const matchInput of input.matches) {
		await tx.insert(schema.match).values({
			scheduledAt: new Date(matchInput.date),
			playedAt: new Date(matchInput.date),
			state: MatchState.PLAYED,
			groupId: group.id,
			rosterAId: rosterMap[matchInput.rosterA],
			rosterBId: rosterMap[matchInput.rosterB],
			teamAScore: matchInput.teamAScore,
			teamBScore: matchInput.teamBScore,
			draws: matchInput.draws
		});
	}
}

async function insertRoster(tx: Transaction, groupId: string, name: string, input: RosterInput) {
	const [team] = await tx.insert(schema.team).values({}).returning();
	const [roster] = await tx
		.insert(schema.roster)
		.values({
			name,
			slug: toSlug(name),
			teamId: team.id,
			groupId
		})
		.returning();

	for (const player of input.players) {
		const playerId = await findOrCreatePlayer(tx, player.battletag);

		try {
			await tx.insert(schema.member).values({
				rosterId: roster.id,
				playerId,
				role: player.role,
				rank: player.rank,
				tier: player.tier,
				sr: player.sr,
				isCaptain: player.is_captain
			});
		} catch (e: any) {
			const drizzle = e as DrizzleError;
			console.log(`Failed to insert ${player.battletag}: ${JSON.stringify(drizzle)}`);
		}
	}

	return { roster };
}

const SEARCH_LIMIT = 10;

type SearchItem = {
	id: string;
	href: string;
	name: string;
	subtitle: string | null;
	type: 'player' | 'roster' | 'season';
};

export const search = query(
	z.object({
		query: z.string()
	}),
	async ({ query }) => {
		const results = await Promise.all([
			searchPlayers(query),
			searchRosters(query),
			searchSeasons(query)
		]);

		return {
			results: results.flat()
		};
	}
);

async function searchPlayers(query: string): Promise<SearchItem[]> {
	const players = await db.query.player.findMany({
		limit: SEARCH_LIMIT,
		where: {
			battletag: {
				ilike: `%${query}%`
			}
		},
		columns: {
			id: true,
			battletag: true
		}
	});

	return players.map((player) => {
		return {
			id: player.id,
			href: `/spelare/${player.battletag.replace('#', '-')}`,
			name: player.battletag.split('#')[0],
			subtitle: 'Spelarprofil',
			type: 'player'
		};
	});
}

async function searchRosters(query: string): Promise<SearchItem[]> {
	const rosters = await db.query.roster.findMany({
		limit: SEARCH_LIMIT,
		where: {
			name: {
				ilike: `%${query}%`
			}
		},
		columns: entityQuery.columns,
		with: {
			group: nestedGroupQuery
		}
	});

	return rosters.map((roster) => {
		const { division, season } = flattenGroup(roster.group);

		return {
			id: roster.id,
			href: `/lag/${roster.slug}/${season.slug}`,
			name: roster.name,
			subtitle: `Lag i ${division.name}, ${season.name}`,
			type: 'roster'
		};
	});
}

async function searchSeasons(query: string): Promise<SearchItem[]> {
	const seasons = await db.query.season.findMany({
		limit: SEARCH_LIMIT,
		where: {
			name: {
				ilike: `%${query}%`
			}
		},
		columns: entityQuery.columns
	});

	return seasons.map((season) => {
		return {
			id: season.id,
			href: `/stallningar/${season.slug}`,
			name: season.name,
			subtitle: null,
			type: 'season'
		};
	});
}
