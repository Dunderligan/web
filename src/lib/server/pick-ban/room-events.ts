import type { RoomSnapshot } from '#lib/pick-ban/index.ts';

/** A single subscriber to a room's snapshot stream. */
export type RoomEventSubscription = AsyncIterableIterator<RoomSnapshot> & {
	close(): void;
};

/**
 * Holds the latest pending snapshot instead of a queue. Live queries only care
 * about the current room state, so intermediate snapshots may be coalesced.
 */
class RoomSubscriber implements RoomEventSubscription {
	#channel: RoomChannel;
	#latest: RoomSnapshot | null = null;
	#resolveNext: ((result: IteratorResult<RoomSnapshot>) => void) | null = null;
	#done = false;

	constructor(channel: RoomChannel) {
		this.#channel = channel;
	}

	[Symbol.asyncIterator](): AsyncIterableIterator<RoomSnapshot> {
		return this;
	}

	next(): Promise<IteratorResult<RoomSnapshot>> {
		if (this.#latest !== null) {
			const value = this.#latest;
			this.#latest = null;
			return Promise.resolve({ value, done: false });
		}

		if (this.#done) {
			return Promise.resolve({ value: undefined, done: true });
		}

		return new Promise((resolve) => {
			this.#resolveNext = resolve;
		});
	}

	return(): Promise<IteratorResult<RoomSnapshot>> {
		this.close();
		return Promise.resolve({ value: undefined, done: true });
	}

	offer(snapshot: RoomSnapshot): void {
		if (this.#done) return;

		if (this.#resolveNext) {
			const resolve = this.#resolveNext;
			this.#resolveNext = null;
			resolve({ value: snapshot, done: false });
		} else {
			this.#latest = snapshot;
		}
	}

	end(): void {
		if (this.#done) return;

		this.#done = true;

		if (this.#resolveNext) {
			const resolve = this.#resolveNext;
			this.#resolveNext = null;
			resolve({ value: undefined, done: true });
		}
	}

	close(): void {
		this.#channel.remove(this);
		this.end();
	}
}

/** A room's subscriber set and latest published snapshot. */
class RoomChannel {
	#subscribers = new Set<RoomSubscriber>();
	#latest: RoomSnapshot | null = null;
	#lastPublished: string | null = null;
	#closed = false;
	#onEmpty: () => void;

	constructor(onEmpty: () => void) {
		this.#onEmpty = onEmpty;
	}

	get subscriberCount(): number {
		return this.#subscribers.size;
	}

	get latest(): RoomSnapshot | null {
		return this.#latest;
	}

	subscribe(): RoomEventSubscription {
		const subscriber = new RoomSubscriber(this);

		if (this.#closed) {
			subscriber.end();
			return subscriber;
		}

		this.#subscribers.add(subscriber);
		return subscriber;
	}

	/** Records the current snapshot without broadcasting it, e.g. after an initial read. */
	prime(snapshot: RoomSnapshot): void {
		if (this.#closed) return;
		this.#latest = snapshot;
	}

	/** Broadcasts a snapshot, returning whether subscribers received it. */
	publish(snapshot: RoomSnapshot): boolean {
		if (this.#closed) return false;

		this.#latest = snapshot;

		const serialized = JSON.stringify(snapshot);
		if (serialized === this.#lastPublished) return false;

		this.#lastPublished = serialized;

		for (const subscriber of this.#subscribers) {
			subscriber.offer(snapshot);
		}

		return this.#subscribers.size > 0;
	}

	remove(subscriber: RoomSubscriber): void {
		this.#subscribers.delete(subscriber);

		if (this.#subscribers.size === 0) {
			this.#onEmpty();
		}
	}

	close(): void {
		if (this.#closed) return;

		this.#closed = true;

		for (const subscriber of this.#subscribers) {
			subscriber.end();
		}

		this.#subscribers.clear();
	}
}

/**
 * In-process fan-out for room snapshots.
 *
 * A single snapshot is loaded after each committed change and distributed to
 * every viewer. The interface can later be backed by Redis pub/sub for
 * multi-instance deployments.
 */
export class RoomEventBus {
	#channels = new Map<string, RoomChannel>();

	subscribe(roomId: string): RoomEventSubscription {
		let channel = this.#channels.get(roomId);

		if (!channel) {
			const created = new RoomChannel(() => {
				if (this.#channels.get(roomId) === created) {
					this.#channels.delete(roomId);
				}
			});

			channel = created;
			this.#channels.set(roomId, channel);
		}

		return channel.subscribe();
	}

	/** Records a snapshot for a room without broadcasting it. */
	prime(roomId: string, snapshot: RoomSnapshot): void {
		this.#channels.get(roomId)?.prime(snapshot);
	}

	/** Publishes a snapshot to all current subscribers, returning whether any received it. */
	publish(roomId: string, snapshot: RoomSnapshot): boolean {
		return this.#channels.get(roomId)?.publish(snapshot) ?? false;
	}

	/** Ends every subscription for a room, e.g. when it has been deleted. */
	close(roomId: string): void {
		const channel = this.#channels.get(roomId);
		if (!channel) return;

		channel.close();
		this.#channels.delete(roomId);
	}

	hasSubscribers(roomId: string): boolean {
		return this.subscriberCount(roomId) > 0;
	}

	subscriberCount(roomId: string): number {
		return this.#channels.get(roomId)?.subscriberCount ?? 0;
	}

	/** The last snapshot recorded for a room, if any. */
	latest(roomId: string): RoomSnapshot | null {
		return this.#channels.get(roomId)?.latest ?? null;
	}
}

export default new RoomEventBus();
