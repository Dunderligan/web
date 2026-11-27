import { fallbackDecision, RoomStatus } from '$lib/pick-ban';
import { MatchState } from '$lib/types';
import { db } from '../db';
import { fullMatchQueryWithContext } from '../db/helpers';
import pickBanService from '.';

class PickBanSweeper {
	#sweepIntervalMillis: number = 5 * 1000; // 5 seconds

	#leadTimeMillis: number = 15 * 60 * 1000; // 15 minutes
	#inactiveTimeoutMillis: number = 60 * 60 * 1000; // 60 minutes

	async run() {
		const jobs = [
			{ name: 'autoCreateRooms', fn: () => this.#autoCreateRooms() },
			{ name: 'autoDeleteInactiveRooms', fn: () => this.#autoDeleteInactiveRooms() },
			{ name: 'applyDeadlineDecisions', fn: () => this.#applyDeadlineDecisions() }
		];

		while (true) {
			for (const job of jobs) {
				try {
					await job.fn();
				} catch (error) {
					console.error(`Error in job ${job.name}:`, error);
				}
			}

			await new Promise((resolve) => setTimeout(resolve, this.#sweepIntervalMillis));
		}
	}

	async #autoCreateRooms() {
		const minStartTime = new Date();
		const maxStartTime = new Date(Date.now() + this.#leadTimeMillis);

		const matches = await db.query.match.findMany({
			...fullMatchQueryWithContext,
			where: {
				state: MatchState.SCHEDULED,
				rosterAId: {
					isNotNull: true
				},
				rosterBId: {
					isNotNull: true
				},
				scheduledAt: {
					gte: minStartTime,
					lte: maxStartTime
				},
				// exclude matches that already have a non-cancelled room
				NOT: {
					rooms: {
						status: {
							notIn: [RoomStatus.CANCELLED]
						}
					}
				}
			}
		});

		for (const match of matches) {
			const shouldCreateRoom = await pickBanService.shouldAutoCreateRoom(match);
			if (shouldCreateRoom) {
				await pickBanService.createRoom(match, null);
				console.log(`Auto-created room for match ${match.id} scheduled at ${match.scheduledAt}`);
			}
		}
	}

	async #autoDeleteInactiveRooms() {
		const cutoffTime = new Date(Date.now() - this.#inactiveTimeoutMillis);

		const roomsToDelete = await db.query.room.findMany({
			columns: {
				id: true
			},
			where: {
				status: RoomStatus.OPEN,
				createdById: {
					isNull: true
				},
				match: {
					scheduledAt: {
						lte: cutoffTime
					}
				}
			}
		});

		for (const room of roomsToDelete) {
			try {
				await pickBanService.deleteRoom(room.id);
			} catch (error) {
				console.error(`Error deleting inactive room ${room.id}:`, error);
			}
		}
	}

	async #applyDeadlineDecisions() {
		const now = new Date();

		const rooms = await db.query.room.findMany({
			columns: {
				id: true
			},
			where: {
				status: RoomStatus.IN_PROGRESS,
				nextDeadlineAt: {
					lte: now
				}
			}
		});

		for (const room of rooms) {
			try {
				await this.applyDeadlineDecision(room.id);
			} catch (error) {
				console.error(`Error applying deadline decision for room ${room.id}:`, error);
			}
		}
	}

	private async applyDeadlineDecision(roomId: string) {
		await pickBanService.applyDecision(
			roomId,
			{ type: 'automatic' },
			({ catalog, config, state }) => {
				const fallback = fallbackDecision({
					catalog,
					config,
					maps: state.maps
				});

				if (!fallback.ok) {
					throw new Error(
						`Failed to generate fallback decision for room ${roomId}: ${fallback.error}`
					);
				}

				return fallback;
			}
		);
	}
}

export default new PickBanSweeper();
