import { describe, expect, it } from 'vitest';
import { RoomStatus, type RoomSnapshot } from '$lib/pick-ban';
import { RoomEventBus } from './room-events';

function snapshot(version = 1): RoomSnapshot {
	return {
		id: 'room-1',
		status: RoomStatus.OPEN,
		teamASeed: 1,
		teamBSeed: 2,
		currentMapIndex: 0,
		version,
		nextDeadlineAt: null,
		closeReason: null,
		closedAt: null,
		createdById: null,
		cancelledById: null,
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
		maps: [],
		presence: { members: [] }
	};
}

describe('RoomEventBus', () => {
	it('publishes snapshots to all subscribers', async () => {
		const bus = new RoomEventBus();
		const first = bus.subscribe('room-1');
		const second = bus.subscribe('room-1');

		expect(bus.subscriberCount('room-1')).toBe(2);
		expect(bus.publish('room-1', snapshot(1))).toBe(true);

		expect((await first.next()).value).toMatchObject({ version: 1 });
		expect((await second.next()).value).toMatchObject({ version: 1 });
	});

	it('delivers snapshots to waiting subscribers', async () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');
		const next = subscription.next();

		bus.publish('room-1', snapshot(1));

		expect((await next).value).toMatchObject({ version: 1 });
	});

	it('coalesces rapid publishes to the latest snapshot', async () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');

		bus.publish('room-1', snapshot(1));
		bus.publish('room-1', snapshot(2));

		expect((await subscription.next()).value).toMatchObject({ version: 2 });
	});

	it('does not broadcast an identical snapshot twice', async () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');
		const value = snapshot(1);

		expect(bus.publish('room-1', value)).toBe(true);
		expect(bus.publish('room-1', value)).toBe(false);

		expect((await subscription.next()).value).toMatchObject({ version: 1 });
	});

	it('does nothing when publishing without subscribers', () => {
		const bus = new RoomEventBus();

		expect(bus.publish('room-1', snapshot(1))).toBe(false);
		expect(bus.hasSubscribers('room-1')).toBe(false);
		expect(bus.latest('room-1')).toBeNull();
	});

	it('removes the channel when the last subscriber leaves', () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');

		expect(bus.hasSubscribers('room-1')).toBe(true);

		subscription.close();

		expect(bus.hasSubscribers('room-1')).toBe(false);
		expect(bus.latest('room-1')).toBeNull();
	});

	it('delivers the final snapshot before ending a closed room', async () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');

		bus.publish('room-1', snapshot(1));
		bus.close('room-1');

		expect((await subscription.next()).value).toMatchObject({ version: 1 });
		expect(await subscription.next()).toMatchObject({ done: true });
		expect(bus.hasSubscribers('room-1')).toBe(false);
	});

	it('ends subscribers when a room is closed without a snapshot', async () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');

		bus.close('room-1');

		expect(await subscription.next()).toMatchObject({ done: true });
	});

	it('does not remove a new channel when an old subscription closes', () => {
		const bus = new RoomEventBus();
		const oldSubscription = bus.subscribe('room-1');

		bus.close('room-1');
		const currentSubscription = bus.subscribe('room-1');

		oldSubscription.close();

		expect(bus.hasSubscribers('room-1')).toBe(true);

		currentSubscription.close();

		expect(bus.hasSubscribers('room-1')).toBe(false);
	});

	it('records primed snapshots without publishing them', async () => {
		const bus = new RoomEventBus();
		const subscription = bus.subscribe('room-1');

		bus.prime('room-1', snapshot(1));

		expect(bus.latest('room-1')).toMatchObject({ version: 1 });
		expect(bus.publish('room-1', snapshot(1))).toBe(true);
		expect((await subscription.next()).value).toMatchObject({ version: 1 });
	});
});
