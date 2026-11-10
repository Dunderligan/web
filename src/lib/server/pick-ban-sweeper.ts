import { RoomState } from '$lib/pick-ban';
import { MatchState } from '$lib/types';
import { inArray } from 'drizzle-orm';
import { db, schema } from './db';
import { fullMatchQueryWithContext } from './db/helpers';
import pickBanService from './pick-ban';

class PickBanSweeper {
	#sweepIntervalMillis: number = 5 * 1000; // 5 seconds

	#leadTimeMillis: number = 15 * 60 * 1000; // 15 minutes
	#inactiveTimeoutMillis: number = 60 * 60 * 1000; // 60 minutes

	async run() {
		const jobs = [
			{ name: 'autoCreateRooms', fn: () => this.#autoCreateRooms() },
			{ name: 'autoDeleteInactiveRooms', fn: () => this.#autoDeleteInactiveRooms() }
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
						state: {
							notIn: [RoomState.CANCELLED]
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
				state: RoomState.OPEN,
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

		const result = await db
			.delete(schema.room)
			.where(
				inArray(
					schema.room.id,
					roomsToDelete.map((room) => room.id)
				)
			)
			.execute();

		if (result.count > 0) {
			console.log(`Auto-deleted ${result.count} inactive rooms.`);
		}
	}
}

const pickBanSweeper = new PickBanSweeper();

export default pickBanSweeper;
