import { matchDivision } from '$lib/match';
import {
	firstMapFirstBanTeam,
	resolveConfig,
	type MatchScope,
	type ResolvedPickBanConfig,
	type SeedPair
} from '$lib/pick-ban';
import { MatchState, type ResolvedMatchWithContext } from '$lib/types';
import { db, schema } from './db';
import { fullGroupQuery } from './db/helpers';
import { generateDivisionStandings, getRosterSeed } from './standings';

class PickBanService {
	async createRoom(match: ResolvedMatchWithContext, createdById: string | null): Promise<string> {
		const seeds = await this.#getTeamSeeds(match);

		if (seeds.a === null || seeds.b === null) {
			throw new Error(`Could not determine team seeds.`);
		}

		const config = await this.retrieveMatchConfig(match);

		const room = await db.transaction(async (tx) => {
			const [room] = await tx
				.insert(schema.room)
				.values({
					configSnapshot: config,
					matchId: match.id,
					teamASeed: seeds.a,
					teamBSeed: seeds.b,
					createdById
				})
				.returning();

			// seed the first map of the room
			await tx.insert(schema.roomMap).values({
				firstBanSlot: firstMapFirstBanTeam(seeds),
				index: 0,
				roomId: room.id
			});

			return room;
		});

		return room.id;
	}

	async #getTeamSeeds(match: ResolvedMatchWithContext): Promise<SeedPair> {
		if (!match.rosterA || !match.rosterB) {
			throw new Error(`Match does not have both rosters assigned.`);
		}

		const division = matchDivision(match);
		if (!division) {
			throw new Error(`Match does not have a division.`);
		}

		const divisionData = await db.query.division.findFirst({
			where: {
				id: division.id
			},
			with: {
				groups: fullGroupQuery,
				season: {
					columns: {
						legacySeeding: true
					}
				}
			}
		});

		if (!divisionData) {
			throw new Error(`Match division ${division.id} not found.`);
		}

		if (match.bracket) {
			// playoff match: use the final seeding from the group stage
			const tables = generateDivisionStandings(divisionData, {
				legacy: divisionData.season.legacySeeding
			});

			const a = getRosterSeed(tables, match.rosterA.id);
			const b = getRosterSeed(tables, match.rosterB.id);

			return { a, b };
		} else {
			// group stage match: use the rosters' initial seeds in their groups
			const allRosters = divisionData.groups.flatMap((g) => g.rosters);
			const a = allRosters.find((r) => r.id === match.rosterA?.id)?.initialSeed ?? null;
			const b = allRosters.find((r) => r.id === match.rosterB?.id)?.initialSeed ?? null;

			return { a, b };
		}
	}

	async shouldAutoCreateRoom(match: ResolvedMatchWithContext): Promise<boolean> {
		if (!match.rosterA || !match.rosterB || match.state !== MatchState.SCHEDULED) {
			return false;
		}

		const division = matchDivision(match);
		if (!division) return false;

		const season = await db.query.season.findFirst({
			where: {
				id: division.season.id
			},
			columns: {
				hidden: true
			}
		});

		if (!season || season.hidden) return false;

		const config = await this.retrieveMatchConfig(match);
		return config.enabled;
	}

	async retrieveMatchConfig(match: ResolvedMatchWithContext): Promise<ResolvedPickBanConfig> {
		const division = matchDivision(match);

		const scope: MatchScope = {
			bracketId: match.bracketId ?? null,
			divisionId: division?.id ?? null,
			round: match.round ?? null
		};

		const configs = await db.query.pickBanConfig.findMany({
			where: {
				bracketId: {
					OR: [
						{
							isNull: true
						},
						{
							eq: scope.bracketId ?? undefined
						}
					]
				},
				divisionId: {
					OR: [
						{
							isNull: true
						},
						{
							eq: scope.divisionId ?? undefined
						}
					]
				}
			}
		});

		return resolveConfig(scope, configs);
	}
}

const pickBanService = new PickBanService();

export default pickBanService;
