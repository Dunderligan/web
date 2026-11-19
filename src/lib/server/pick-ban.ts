import { matchDivision } from '$lib/match';
import {
	applyDecision,
	firstMapFirstBanTeam,
	fixedMapForGame,
	isMatchComplete,
	mapDecisionsComplete,
	MapOutcome,
	matchProgress,
	nextMapFirstBanTeam,
	PickBanMapType,
	resolveConfig,
	resolveResult,
	RoomCloseReason,
	RoomMapReportState,
	RoomStatus,
	submitReport,
	type DecisionActor,
	type DecisionInput,
	type MapCatalogEntry,
	type MatchScope,
	type ResolvedPickBanConfig,
	type RoomState,
	type RuleCatalog,
	type SeedPair
} from '$lib/pick-ban';
import { MatchSlot, MatchState, type Member, type ResolvedMatchWithContext } from '$lib/types';
import { and, eq } from 'drizzle-orm';
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

type RoomServerContext = {
	config: ResolvedPickBanConfig;
	state: RoomState;
	catalog: RuleCatalog;
	matchId: string;
};

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
	 * Starts a room once both teams are ready.
	 */
	async startRoom(roomId: string): Promise<void> {
		console.log(`Starting room ${roomId}...`);

		return await db.transaction(async (tx) => {
			await this.#mutateRoom(tx, roomId, async (context) => {
				if (context.state.status !== RoomStatus.OPEN) {
					throw error(400, `Room is not in the open state.`);
				}

				context.state.status = RoomStatus.IN_PROGRESS;

				this.#advanceRoom(tx, context);
			});
		});
	}

	async cancelRoom(roomId: string, cancelledById: string | null): Promise<void> {
		await db.transaction(async (tx) => {
			await this.#mutateRoom(tx, roomId, async (context) => {
				if (
					context.state.status !== RoomStatus.OPEN &&
					context.state.status !== RoomStatus.IN_PROGRESS
				) {
					throw error(400, `Room is not in a cancellable state.`);
				}

				context.state.status = RoomStatus.CANCELLED;
				context.state.closeReason = RoomCloseReason.CANCELLED;
				context.state.closedAt = new Date();
				context.state.cancelledById = cancelledById;
			});
		});
	}

	async applyDecision(
		roomId: string,
		actor: DecisionActor,
		decisionFn: (context: RoomServerContext) => { slot: MatchSlot; decision: DecisionInput }
	): Promise<void> {
		await db.transaction(async (tx) => {
			await this.#mutateRoom(tx, roomId, async (context) => {
				const { slot, decision: input } = decisionFn(context);

				const result = applyDecision({
					actor,
					config: context.config,
					maps: context.state.maps,
					now: new Date(),
					slot,
					status: context.state.status,
					decision: input,
					catalog: context.catalog
				});

				if (!result.ok) {
					throw error(400, `Failed to apply decision: ${result.error}`);
				}

				const { map: updatedMap } = result;

				context.state.maps[updatedMap.index] = updatedMap;

				if (mapDecisionsComplete(context.config, updatedMap)) {
					this.#clearDeadline(context);
				} else {
					this.#advanceDeadline(context);
				}
			});
		});
	}

	async submitReport(
		roomId: string,
		byId: string,
		slot: MatchSlot,
		outcome: MapOutcome
	): Promise<void> {
		await db.transaction(async (tx) => {
			await this.#mutateRoom(tx, roomId, async (context) => {
				const result = submitReport({
					config: context.config,
					maps: context.state.maps,
					slot,
					now: new Date(),
					outcome,
					submittedById: byId
				});

				if (!result.ok) {
					throw error(400, `Failed to submit report: ${result.error}`);
				}

				const { map: updatedMap } = result;

				context.state.maps[updatedMap.index] = updatedMap;

				if (updatedMap.reportState === RoomMapReportState.AGREED) {
					await this.#advanceRoom(tx, context);
				}
			});
		});
	}

	async resolveResult(roomId: string, adminId: string, outcome: MapOutcome): Promise<void> {
		await db.transaction(async (tx) => {
			await this.#mutateRoom(tx, roomId, async (context) => {
				const result = resolveResult({
					adminId: adminId,
					config: context.config,
					maps: context.state.maps,
					now: new Date(),
					outcome
				});

				if (!result.ok) {
					throw error(400, `Failed to resolve result: ${result.error}`);
				}

				const { map: updatedMap } = result;

				context.state.maps[updatedMap.index] = updatedMap;

				await this.#advanceRoom(tx, context);
			});
		});
	}

	async #advanceRoom(tx: Transaction, context: RoomServerContext): Promise<void> {
		const { config, state, catalog } = context;

		if (isMatchComplete(config, state.maps)) {
			state.status = RoomStatus.FINISHED;
			state.closeReason = RoomCloseReason.FINISHED;
			state.closedAt = new Date();

			this.#clearDeadline(context);
			await this.#writeMatchResult(tx, context);
			return;
		}

		console.log(`Advancing ${JSON.stringify(context.state)}...`);

		// advance to the next map
		let firstBanSlot: MatchSlot;
		if (state.maps.length === 0) {
			firstBanSlot = firstMapFirstBanTeam({
				a: state.teamASeed,
				b: state.teamBSeed
			});
		} else {
			const prevMap = state.maps[state.currentMapIndex];
			state.currentMapIndex++;
			firstBanSlot = nextMapFirstBanTeam(prevMap);
		}

		let fixedMap: MapCatalogEntry | null = null;
		if (config.mapType === PickBanMapType.FIXED) {
			fixedMap = fixedMapForGame(config, state.currentMapIndex, catalog.maps);
		}

		state.maps.push({
			index: state.currentMapIndex,
			mapId: fixedMap?.id ?? null,
			firstBanSlot,
			decisions: [],
			reports: [],
			reportState: RoomMapReportState.PENDING,
			outcome: null,
			resultRecordedAt: null,
			resolvedById: null,
			decisionsCompletedAt: null
		});

		this.#advanceDeadline(context);
	}

	async #writeMatchResult(tx: Transaction, { config, state, matchId }: RoomServerContext) {
		const progress = matchProgress(config, state.maps);

		await tx
			.update(schema.match)
			.set({
				state: MatchState.PLAYED,
				teamAScore: progress.teamAWins,
				teamBScore: progress.teamBWins,
				draws: progress.draws,
				playedAt: state.createdAt
			})
			.where(and(eq(schema.match.id, matchId), eq(schema.match.state, MatchState.SCHEDULED)));
	}

	#advanceDeadline(context: RoomServerContext) {
		const newDeadline = new Date().getTime() + context.config.decisionTimeoutSeconds * 1000;
		context.state.nextDeadlineAt = new Date(newDeadline);
	}

	#clearDeadline(context: RoomServerContext) {
		context.state.nextDeadlineAt = null;
	}

	/**
	 *
	 */
	async #mutateRoom(
		tx: Transaction,
		roomId: string,
		mutate: (context: RoomServerContext) => Promise<void>
	): Promise<void> {
		const context = await this.#getContext(tx, roomId);

		const prevState = JSON.parse(JSON.stringify(context.state)) as RoomState;

		await mutate(context);

		context.state.version++;
		context.state.updatedAt = new Date();

		await this.#upsertRoomState(tx, prevState, context.state);
	}

	async #upsertRoomState(
		tx: Transaction,
		prevState: RoomState,
		newState: RoomState
	): Promise<void> {
		const { id: roomId, maps: newMaps, ...newRoom } = newState;
		const { maps: prevMaps } = prevState;

		await tx.update(schema.room).set(newRoom).where(eq(schema.room.id, roomId));

		for (const newMap of newMaps) {
			const { reports, decisions, ...newMapData } = newMap;
			const prevMap = prevMaps.find((m) => m.index === newMap.index);

			let mapId: string;
			if (!prevMap) {
				const [inserted] = await tx
					.insert(schema.roomMap)
					.values({ ...newMapData, roomId })
					.returning({ id: schema.roomMap.id });

				mapId = inserted.id;
			} else {
				const [updated] = await tx
					.update(schema.roomMap)
					.set(newMapData)
					.where(and(eq(schema.roomMap.roomId, roomId), eq(schema.roomMap.index, newMap.index)))
					.returning({ id: schema.roomMap.id });

				mapId = updated.id;
			}

			for (const newDecision of decisions) {
				const prevDecision = prevMap?.decisions.find((d) => d.point === newDecision.point);

				if (!prevDecision) {
					await tx.insert(schema.roomDecision).values({ ...newDecision, roomMapId: mapId });
				}
			}

			for (const newReport of reports) {
				const prevReport = prevMap?.reports.find((r) => r.slot === newReport.slot);

				if (!prevReport) {
					await tx.insert(schema.roomReport).values({ ...newReport, roomMapId: mapId });
				}
			}
		}
	}

	async #getContext(tx: Transaction, roomId: string): Promise<RoomServerContext> {
		const [roomData, heroes, maps] = await Promise.all([
			tx.query.room.findFirst({
				...roomStateQuery,
				columns: {
					...roomStateQuery.columns,
					configSnapshot: true,
					matchId: true
				},
				where: {
					id: roomId
				}
			}),
			tx.select().from(schema.hero),
			tx.select().from(schema.map)
		]);

		if (!roomData) {
			throw error(404, `Room ${roomId} not found`);
		}

		const { configSnapshot: config, matchId, ...state } = roomData;

		return {
			config,
			state,
			catalog: { heroes, maps },
			matchId
		};
	}
}

const pickBanService = new PickBanService();

export default pickBanService;
