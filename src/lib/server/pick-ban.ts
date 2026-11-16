import { matchDivision } from '$lib/match';
import {
	applyDecision,
	firstMapFirstBanTeam,
	isMatchComplete,
	MapOutcome,
	nextMapFirstBanTeam,
	resolveConfig,
	RoomCloseReason,
	RoomMapReportState,
	RoomStatus,
	submitReport,
	type DecisionActor,
	type DecisionInput,
	type MatchScope,
	type ResolvedPickBanConfig,
	type RoomState,
	type SeedPair
} from '$lib/pick-ban';
import { MatchSlot, MatchState, type Member, type ResolvedMatchWithContext } from '$lib/types';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from './db';
import { fullGroupQuery, memberQuery, roomStateQuery, type Transaction } from './db/helpers';
import { generateDivisionStandings, getRosterSeed } from './standings';
import { error } from '@sveltejs/kit';

/** A signed-in roster member who is allowed to participate in a room. */
export type RoomParticipant = {
	userId: string;
	slot: MatchSlot;
	roomStatus: RoomStatus;
	member: Member;
};

export type RoomMutation = Partial<
	Omit<
		typeof schema.room.$inferInsert,
		'id' | 'matchId' | 'createdById' | 'createdAt' | 'updatedAt' | 'version'
	>
>;

class PickBanService {
	/**
	 * Creates a new pick-ban room for a match. The match must have both rosters assigned and the
	 * rosters must have valid seeds (either initial seeds for group stage matches, or final seeds
	 * from the group stage for bracket matches).
	 */
	async createRoom(match: ResolvedMatchWithContext, createdById: string | null): Promise<string> {
		const seeds = await this.#getTeamSeeds(match);

		if (seeds.a === null || seeds.b === null) {
			throw new Error(`Could not determine team seeds.`);
		}

		const config = await this.retrieveMatchConfig(match);

		const values: typeof schema.room.$inferInsert = {
			configSnapshot: config,
			matchId: match.id,
			teamASeed: seeds.a,
			teamBSeed: seeds.b,
			createdById
		};

		const [room] = await db.insert(schema.room).values(values).returning();

		return room.id;
	}

	/**
	 * Returns the seeds of the two rosters in a match. In a group stage match, this is the rosters'
	 * initial seeds. In a bracket match, it's calculated from the final standings of the group stage.
	 */
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
			// bracket match: use the final seeding from the group stage
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

	/**
	 * Returns whether a room should be automatically created for a match when it is scheduled.
	 * This requires the following:
	 * - The match has both rosters assigned
	 * - The match is in the scheduled state
	 * - The match is not in a hidden season
	 * - The match's pick-ban config is set to enabled
	 */
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

	/**
	 * Retrieves all the applicable pick-ban configs for a match and resolves them to one
	 * final config via `resolveConfig`.
	 */
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

	/**
	 * Resolves the participant entry for a signed-in user, or null when the room does not exist
	 * or the user is not on one of the participating rosters.
	 */
	async getRoomParticipant(
		roomId: string,
		user: { id: string; battletag: string }
	): Promise<RoomParticipant | null> {
		const room = await db.query.room.findFirst({
			where: {
				id: roomId
			},
			columns: {
				id: true,
				status: true
			},
			with: {
				match: {
					columns: {},
					with: {
						rosterA: {
							columns: {},
							with: {
								members: memberQuery
							}
						},
						rosterB: {
							columns: {},
							with: {
								members: memberQuery
							}
						}
					}
				}
			}
		});

		if (!room) return null;

		const battletag = user.battletag.toLowerCase();
		const slots: { slot: MatchSlot; roster: typeof room.match.rosterA }[] = [
			{ slot: MatchSlot.A, roster: room.match.rosterA },
			{ slot: MatchSlot.B, roster: room.match.rosterB }
		];

		for (const { slot, roster } of slots) {
			const member = roster?.members.find((m) => m.player.battletag.toLowerCase() === battletag);

			if (member) {
				return {
					userId: user.id,
					roomStatus: room.status,
					slot,
					member
				};
			}
		}

		return null;
	}

	/**
	 * Starts a room once both teams are ready. Returns false when the room was already started
	 * (or is no longer open), so a racing ready confirmation cannot open the room twice.
	 */
	async startRoom(roomId: string): Promise<boolean> {
		return await this.mutateRoom(
			roomId,
			async (tx, config, state) => {
				if (state.status !== RoomStatus.OPEN) return null;

				const patch = await this.#advanceRoom(tx, roomId, state, config);

				return {
					status: RoomStatus.IN_PROGRESS,
					...patch
				};
			},
			{
				advanceDeadline: true
			}
		);
	}

	async #getCurrentMap(
		roomId: string,
		state: RoomState,
		tx: Transaction
	): Promise<{ id: string } | null> {
		const [roomMap] = await tx
			.select({ id: schema.roomMap.id })
			.from(schema.roomMap)
			.where(
				and(eq(schema.roomMap.index, state.currentMapIndex), eq(schema.roomMap.roomId, roomId))
			)
			.limit(1);

		return roomMap ?? null;
	}

	async applyDecision(
		roomId: string,
		actor: DecisionActor,
		input: DecisionInput,
		slot: MatchSlot
	): Promise<void> {
		await pickBanService.mutateRoom(
			roomId,
			async (tx, config, state) => {
				const [heroes, maps, roomMap] = await Promise.all([
					tx.select().from(schema.hero),
					tx.select().from(schema.map),
					this.#getCurrentMap(roomId, state, tx)
				]);

				if (!roomMap) {
					throw error(400, `No current map found for room ${roomId}`);
				}

				const result = applyDecision({
					actor,
					config,
					maps: state.maps,
					now: new Date(),
					slot,
					status: state.status,
					decision: input,
					catalog: { heroes, maps }
				});

				if (!result.ok) {
					throw error(400, `Failed to apply decision: ${result.error}`);
				}

				// write the decision and updated map state to the database
				const { decision, map: updatedMap } = result;

				await tx.insert(schema.roomDecision).values({
					roomMapId: roomMap.id,
					...decision
				});
				await tx.update(schema.roomMap).set(updatedMap).where(eq(schema.roomMap.id, roomMap.id));

				// we don't need to modify the room object further ourselves
				return {};
			},
			{
				advanceDeadline: true
			}
		);
	}

	async addReport(roomId: string, byId: string, slot: MatchSlot, outcome: MapOutcome) {
		await pickBanService.mutateRoom(roomId, async (tx, config, state) => {
			const roomMap = await this.#getCurrentMap(roomId, state, tx);

			if (!roomMap) {
				throw error(400, `No current map found for room ${roomId}`);
			}

			const result = submitReport({
				config,
				maps: state.maps,
				slot,
				now: new Date(),
				outcome,
				submittedById: byId
			});

			if (!result.ok) {
				throw error(400, `Failed to apply decision: ${result.error}`);
			}

			// write the updated map state to the database
			const { map: updatedMap } = result;

			state.maps[updatedMap.index] = updatedMap;

			await tx.update(schema.roomMap).set(updatedMap).where(eq(schema.roomMap.id, roomMap.id));

			// insert the new report
			const report = updatedMap.reports.find((r) => r.slot === slot);
			if (!report) {
				throw error(500, `Report not found after update for room ${roomId}, slot ${slot}`);
			}

			await tx.insert(schema.roomReport).values({
				outcome: report.outcome,
				roomMapId: roomMap.id,
				slot: report.slot,
				submittedById: byId
			});

			if (updatedMap.reportState === RoomMapReportState.AGREED) {
				return await this.#advanceRoom(tx, roomId, state, config);
			}

			return {};
		});
	}

	async #advanceRoom(
		tx: Transaction,
		roomId: string,
		state: RoomState,
		config: ResolvedPickBanConfig
	): Promise<RoomMutation> {
		if (isMatchComplete(config, state.maps)) {
			return {
				status: RoomStatus.FINISHED,
				closeReason: RoomCloseReason.FINISHED,
				closedAt: new Date()
			};
		}

		let firstBanSlot: MatchSlot;
		if (state.currentMapIndex == 0) {
			firstBanSlot = firstMapFirstBanTeam({
				a: state.teamASeed,
				b: state.teamBSeed
			});
		} else {
			const prevMap = state.maps[state.currentMapIndex - 1];
			firstBanSlot = nextMapFirstBanTeam(prevMap);
		}

		await tx
			.insert(schema.roomMap)
			.values({
				roomId,
				firstBanSlot,
				index: state.currentMapIndex + 1
			})
			.returning();

		return {
			currentMapIndex: state.currentMapIndex + 1
		};
	}

	/**
	 * Mutates a room's state atomically in a transaction, incrementing the version, updatedAt and optionally
	 * setting a new nextDeadlineAt. Updates to maps, decisions and related tables should be done in the same transaction.
	 *
	 * Returns true for successful mutations, false if the room was not found or the version check failed
	 * (meaning a concurrent mutation was committed).
	 */
	async mutateRoom(
		roomId: string,
		mutate: (
			tx: Transaction,
			config: ResolvedPickBanConfig,
			state: RoomState
		) => Promise<RoomMutation | null>,
		{ advanceDeadline = false }: { advanceDeadline?: boolean } = {}
	): Promise<boolean> {
		return await db.transaction(async (tx) => {
			const data = await tx.query.room.findFirst({
				...roomStateQuery,
				columns: {
					...roomStateQuery.columns,
					configSnapshot: true
				},
				where: {
					id: roomId
				}
			});

			if (!data) return false;

			const { configSnapshot: config, ...roomState } = data;

			const roomMutation = await mutate(tx, config, roomState);

			const nextDeadlineAt = advanceDeadline
				? sql`now() + ${config.decisionTimeoutSeconds} * interval '1 second'`
				: null;

			const updatedRoom = await tx
				.update(schema.room)
				.set({
					...roomMutation,
					nextDeadlineAt: nextDeadlineAt,
					version: sql`${schema.room.version} + 1`,
					updatedAt: sql`now()`
				})
				.where(and(eq(schema.room.id, roomId), eq(schema.room.version, roomState.version)))
				.returning({ id: schema.room.id });

			return updatedRoom.length > 0;
		});
	}
}

const pickBanService = new PickBanService();

export default pickBanService;
