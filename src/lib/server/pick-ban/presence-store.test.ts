import { describe, expect, it } from 'vitest';
import { MatchSlot } from '$lib/types';
import { InMemoryPresenceStore, type PresenceParticipant } from './presence-store';

const captainA: PresenceParticipant = {
	userId: 'user-a',
	battletag: 'CaptainA#1234',
	slot: MatchSlot.A,
	isCaptain: true
};

const captainB: PresenceParticipant = {
	userId: 'user-b',
	battletag: 'CaptainB#5678',
	slot: MatchSlot.B,
	isCaptain: true
};

function createStore() {
	let now = 1_000;
	const store = new InMemoryPresenceStore(1_000, () => now);

	return {
		store,
		advance(ms: number) {
			now += ms;
		}
	};
}

describe('InMemoryPresenceStore', () => {
	it('lists connected participants without readiness by default', async () => {
		const { store } = createStore();

		await store.heartbeat('room', captainA);

		expect(await store.list('room')).toEqual({
			members: [{ ...captainA, ready: false }]
		});
	});

	it('records and withdraws readiness', async () => {
		const { store } = createStore();
		await store.heartbeat('room', captainA);

		await store.setReady('room', captainA.userId, true);
		expect(await store.list('room')).toMatchObject({
			members: [{ userId: captainA.userId, ready: true }]
		});

		await store.setReady('room', captainA.userId, false);
		expect(await store.list('room')).toMatchObject({
			members: [{ userId: captainA.userId, ready: false }]
		});
	});

	it('ignores readiness for a participant that is not connected', async () => {
		const { store } = createStore();

		await store.setReady('room', captainA.userId, true);

		expect(await store.list('room')).toEqual({ members: [] });
	});

	it('keeps readiness while heartbeats continue', async () => {
		const { store, advance } = createStore();
		await store.heartbeat('room', captainA);
		await store.setReady('room', captainA.userId, true);

		advance(500);
		await store.heartbeat('room', captainA);

		expect(await store.list('room')).toMatchObject({
			members: [{ userId: captainA.userId, ready: true }]
		});
	});

	it('withdraws readiness when the participant reconnects after expiring', async () => {
		const { store, advance } = createStore();
		await store.heartbeat('room', captainA);
		await store.setReady('room', captainA.userId, true);

		advance(1_001);
		await store.heartbeat('room', captainA);

		expect(await store.list('room')).toMatchObject({
			members: [{ userId: captainA.userId, ready: false }]
		});
	});

	it('drops participants whose heartbeat expired', async () => {
		const { store, advance } = createStore();
		await store.heartbeat('room', captainA);
		await store.heartbeat('room', captainB);

		advance(1_001);

		expect(await store.list('room')).toEqual({ members: [] });
	});

	it('removes a participant when they leave', async () => {
		const { store } = createStore();
		await store.heartbeat('room', captainA);

		await store.leave('room', captainA.userId);

		expect(await store.list('room')).toEqual({ members: [] });
	});

	it('discards all presence when the room is cleared', async () => {
		const { store } = createStore();
		await store.heartbeat('room', captainA);
		await store.setReady('room', captainA.userId, true);

		await store.clear('room');

		expect(await store.list('room')).toEqual({ members: [] });
	});
});
