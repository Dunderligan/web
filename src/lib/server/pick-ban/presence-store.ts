import type { createClient } from 'redis';
import type { MatchSlot } from '$lib/types';
import type { RoomPresence, RoomPresenceMember } from '$lib/pick-ban';

type RedisClient = ReturnType<typeof createClient>;

/** How long a heartbeat keeps a participant connected. */
export const PRESENCE_TTL_MS = 45 * 1000;

/** A signed-in roster member who may join a room's presence. */
export type PresenceParticipant = {
	userId: string;
	battletag: string;
	slot: MatchSlot;
	isCaptain: boolean;
};

/** Ephemeral presence and readiness for a single room. */
export interface PresenceStore {
	/** Registers or refreshes a participant. A participant that was not connected starts out not ready. */
	heartbeat(roomId: string, participant: PresenceParticipant): Promise<void>;
	/** Removes a participant immediately, e.g. when they leave the room. */
	leave(roomId: string, userId: string): Promise<void>;
	/** Records or withdraws a participant's readiness. The participant must already be connected. */
	setReady(roomId: string, userId: string, ready: boolean): Promise<void>;
	/** The participants that are currently connected, including their readiness. */
	list(roomId: string): Promise<RoomPresence>;
	/** Discards all presence for a room. */
	clear(roomId: string): Promise<void>;
}

type InMemoryEntry = {
	participant: PresenceParticipant;
	expiresAt: number;
	ready: boolean;
};

/** Single-process fallback used when Redis is not configured. Only correct with one app instance. */
export class InMemoryPresenceStore implements PresenceStore {
	#rooms = new Map<string, Map<string, InMemoryEntry>>();
	#ttlMs: number;
	#now: () => number;

	constructor(ttlMs = PRESENCE_TTL_MS, now = Date.now) {
		this.#ttlMs = ttlMs;
		this.#now = now;
	}

	async heartbeat(roomId: string, participant: PresenceParticipant): Promise<void> {
		const room = this.#getRoom(roomId);
		const existing = room.get(participant.userId);
		const isNewConnection = !existing || existing.expiresAt <= this.#now();

		room.set(participant.userId, {
			participant,
			expiresAt: this.#now() + this.#ttlMs,
			ready: isNewConnection ? false : existing.ready
		});
	}

	async leave(roomId: string, userId: string): Promise<void> {
		this.#rooms.get(roomId)?.delete(userId);
	}

	async setReady(roomId: string, userId: string, ready: boolean): Promise<void> {
		const entry = this.#rooms.get(roomId)?.get(userId);
		if (!entry || entry.expiresAt <= this.#now()) return;

		entry.ready = ready;
	}

	async list(roomId: string): Promise<RoomPresence> {
		const room = this.#rooms.get(roomId);
		if (!room) return { members: [] };

		const now = this.#now();
		const members: RoomPresenceMember[] = [];

		for (const [userId, entry] of room) {
			if (entry.expiresAt <= now) {
				room.delete(userId);
				continue;
			}

			members.push({ ...entry.participant, ready: entry.ready });
		}

		if (room.size === 0) this.#rooms.delete(roomId);

		return { members };
	}

	async clear(roomId: string): Promise<void> {
		this.#rooms.delete(roomId);
	}

	#getRoom(roomId: string): Map<string, InMemoryEntry> {
		let room = this.#rooms.get(roomId);
		if (!room) {
			room = new Map();
			this.#rooms.set(roomId, room);
		}
		return room;
	}
}

/** Redis-backed presence that survives across processes and app instances. */
export class RedisPresenceStore implements PresenceStore {
	#client: RedisClient;
	#ttlMs: number;
	#now: () => number;

	constructor(client: RedisClient, ttlMs = PRESENCE_TTL_MS, now = Date.now) {
		this.#client = client;
		this.#ttlMs = ttlMs;
		this.#now = now;
	}

	async heartbeat(roomId: string, participant: PresenceParticipant): Promise<void> {
		const presenceKey = this.#presenceKey(roomId);

		// A heartbeat after the previous one expired is a fresh connection: readiness starts over.
		const previousScore = await this.#client.zScore(presenceKey, participant.userId);

		await this.#client
			.multi()
			.hSet(this.#metaKey(roomId), participant.userId, JSON.stringify(participant))
			.zAdd(presenceKey, { score: this.#now() + this.#ttlMs, value: participant.userId })
			.exec();

		if (previousScore === null || previousScore <= this.#now()) {
			await this.#client.sRem(this.#readyKey(roomId), participant.userId);
		}
	}

	async leave(roomId: string, userId: string): Promise<void> {
		await this.#client
			.multi()
			.zRem(this.#presenceKey(roomId), userId)
			.hDel(this.#metaKey(roomId), userId)
			.sRem(this.#readyKey(roomId), userId)
			.exec();
	}

	async setReady(roomId: string, userId: string, ready: boolean): Promise<void> {
		const score = await this.#client.zScore(this.#presenceKey(roomId), userId);
		if (score === null || score <= this.#now()) return;

		if (ready) {
			await this.#client.sAdd(this.#readyKey(roomId), userId);
		} else {
			await this.#client.sRem(this.#readyKey(roomId), userId);
		}
	}

	async list(roomId: string): Promise<RoomPresence> {
		const presenceKey = this.#presenceKey(roomId);
		const now = this.#now();

		const entries = await this.#client.zRangeWithScores(presenceKey, 0, -1);
		const expired = entries.filter((entry) => entry.score <= now).map((entry) => entry.value);

		if (expired.length > 0) {
			await this.#client
				.multi()
				.zRem(presenceKey, expired)
				.hDel(this.#metaKey(roomId), expired)
				.sRem(this.#readyKey(roomId), expired)
				.exec();
		}

		const connected = entries.filter((entry) => entry.score > now).map((entry) => entry.value);
		if (connected.length === 0) return { members: [] };

		const [meta, ready] = await Promise.all([
			this.#client.hGetAll(this.#metaKey(roomId)),
			this.#client.sMembers(this.#readyKey(roomId))
		]);

		const readyIds = new Set(ready);
		const members: RoomPresenceMember[] = [];

		for (const userId of connected) {
			const raw = meta[userId];
			if (!raw) continue;

			members.push({ ...(JSON.parse(raw) as PresenceParticipant), ready: readyIds.has(userId) });
		}

		return { members };
	}

	async clear(roomId: string): Promise<void> {
		await this.#client.del([
			this.#presenceKey(roomId),
			this.#metaKey(roomId),
			this.#readyKey(roomId)
		]);
	}

	#presenceKey(roomId: string): string {
		return `pick-ban:presence:${roomId}`;
	}

	#metaKey(roomId: string): string {
		return `pick-ban:presence-meta:${roomId}`;
	}

	#readyKey(roomId: string): string {
		return `pick-ban:ready:${roomId}`;
	}
}
