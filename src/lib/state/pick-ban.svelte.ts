import {
	matchProgress,
	nextDecisionPoint,
	type DecisionInput,
	type GamemodeCatalogEntry,
	type ResolvedPickBanConfig,
	type RoomPresenceMember,
	type RoomSnapshot,
	type RuleCatalog
} from '$lib/pick-ban';
import type { User } from '$lib/server/db/schema/auth';
import { MatchSlot, type MemberWithProfile, type ResolvedMatchWithContext } from '$lib/types';
import { SvelteDate } from 'svelte/reactivity';
import { defineContext } from './util';
import {
	heartbeatRoom,
	leaveRoom,
	makeDecision,
	setRoomReady,
	subscribeToRoom
} from '$lib/remote/pick-ban.remote';

const { get, set } = defineContext<PickBanContext>('$_pick_ban_state');

/** Presence is refreshed well within the 45 second server-side TTL. */
const PRESENCE_HEARTBEAT_INTERVAL_MS = 15 * 1000;

export type ConnectionState = 'connected' | 'loading' | 'disconnected';

export class PickBanContext {
	static get = get;
	static set = set;

	roomId: string;
	catalog: RuleCatalog;
	gamemodes: GamemodeCatalogEntry[];
	config: ResolvedPickBanConfig;
	match: ResolvedMatchWithContext;
	teamAMembers: MemberWithProfile[];
	teamBMembers: MemberWithProfile[];
	state: RoomSnapshot;
	user: User | null;

	now: SvelteDate;
	readyPending = $state(false);

	#nowInterval: NodeJS.Timeout | null = null;
	#heartbeatInterval: NodeJS.Timeout | null = null;
	#liveQuery: ReturnType<typeof subscribeToRoom>;
	#destroyed = false;

	connectionState: ConnectionState = $derived.by(() => {
		if (this.#destroyed) return 'disconnected';
		if (this.#liveQuery.connected) return 'connected';
		if (this.#liveQuery.loading) return 'loading';
		return 'disconnected';
	});

	status = $derived.by(() => this.state.status);
	matchProgress = $derived.by(() => matchProgress(this.config, this.state.maps));
	nextDecision = $derived.by(() => nextDecisionPoint(this.config, this.state.maps, this.status));

	deadlineInMillis = $derived.by(() => {
		const decisionDeadline = this.state.nextDeadlineAt;
		if (!decisionDeadline) return null;

		const diff = decisionDeadline.getTime() - this.now.getTime();
		return Math.max(diff, 0);
	});

	#userInfo = $derived.by(() => {
		if (!this.user) return null;
		return this.findMemberByBattletag(this.user.battletag);
	});

	#userIsParticipant = $derived.by(() => this.#userInfo !== null);
	userSlot = $derived.by(() => this.#userInfo?.slot ?? null);
	userMember = $derived.by(() => this.#userInfo?.member ?? null);
	userIsCaptain = $derived.by(() => this.#userInfo?.member.member.isCaptain ?? false);

	userTeamReady = $derived.by(() => {
		const slot = this.userSlot;
		return slot === null ? false : this.isTeamReady(slot);
	});

	constructor({
		roomId,
		catalog,
		gamemodes,
		config,
		match,
		teamAMembers,
		teamBMembers,
		initialState,
		user
	}: {
		roomId: string;
		catalog: RuleCatalog;
		gamemodes: GamemodeCatalogEntry[];
		config: ResolvedPickBanConfig;
		match: ResolvedMatchWithContext;
		teamAMembers: MemberWithProfile[];
		teamBMembers: MemberWithProfile[];
		initialState: RoomSnapshot;
		user: User | null;
	}) {
		this.roomId = roomId;
		this.catalog = catalog;
		this.gamemodes = gamemodes;
		this.config = config;
		this.match = match;
		this.teamAMembers = teamAMembers;
		this.teamBMembers = teamBMembers;
		this.state = $state(initialState);
		this.user = user;
		this.now = $state(new SvelteDate());

		this.#liveQuery = subscribeToRoom({ roomId: this.roomId });
	}

	/**
	 * Starts the client-only timers: the countdown clock and the presence heartbeat.
	 * Call from an effect so it only runs in the browser, and return the cleanup.
	 */
	startClient() {
		if (this.#destroyed || this.#nowInterval) return () => this.destroy();

		console.log('Starting PickBanContext for room', this.roomId);

		this.#listenToLiveQuery();

		this.now = new SvelteDate();
		this.#nowInterval = setInterval(() => {
			this.now = new SvelteDate();
		}, 1000);

		if (this.#userIsParticipant) {
			void this.#sendHeartbeat();

			this.#heartbeatInterval = setInterval(() => {
				void this.#sendHeartbeat();
			}, PRESENCE_HEARTBEAT_INTERVAL_MS);
		}

		return () => this.destroy();
	}

	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;

		console.log('Destroying PickBanContext for room', this.roomId);

		if (this.#nowInterval) clearInterval(this.#nowInterval);
		if (this.#heartbeatInterval) clearInterval(this.#heartbeatInterval);
		this.#nowInterval = null;
		this.#heartbeatInterval = null;

		if (this.#userIsParticipant) {
			void leaveRoom({ roomId: this.roomId }).catch(() => {});
		}
	}

	async makeDecision(input: DecisionInput) {
		await makeDecision({
			roomId: this.roomId,
			decision: input
		});
	}

	/** Presence failures (for example when the room closes) must never break the page. */
	async #sendHeartbeat() {
		try {
			await heartbeatRoom({ roomId: this.roomId });
		} catch {
			// The room may have closed between heartbeats; the live query will show the new status.
		}
	}

	/** Confirms or withdraws readiness for the signed-in captain's own team. */
	async setReady(ready: boolean) {
		if (this.readyPending) return;

		this.readyPending = true;

		try {
			await setRoomReady({ roomId: this.roomId, ready });
			// apply the change optimistically
			for (const member of this.state.presence.members) {
				if (member.userId === this.user?.id) {
					member.ready = ready;
				}
			}
		} finally {
			this.readyPending = false;
		}
	}

	presenceFor(battletag: string): RoomPresenceMember | null {
		const key = battletag.toLowerCase();
		return (
			this.state.presence?.members.find((member) => member.battletag.toLowerCase() === key) ?? null
		);
	}

	isMemberConnected(battletag: string): boolean {
		return this.presenceFor(battletag) !== null;
	}

	isMemberReady(battletag: string): boolean {
		return this.presenceFor(battletag)?.ready ?? false;
	}

	isTeamConnected(slot: MatchSlot): boolean {
		return (this.state.presence?.members ?? []).some((member) => member.slot === slot);
	}

	/** A team is ready while at least one of its connected captains has confirmed readiness. */
	isTeamReady(slot: MatchSlot): boolean {
		return (this.state.presence?.members ?? []).some(
			(member) => member.slot === slot && member.isCaptain && member.ready
		);
	}

	async #listenToLiveQuery() {
		for await (const state of this.#liveQuery) {
			if (this.#destroyed) break;

			this.state = state;
		}
	}

	findMemberByBattletag(battletag: string): { slot: MatchSlot; member: MemberWithProfile } | null {
		const key = battletag.toLowerCase();

		for (const member of this.teamAMembers) {
			if (member.member.player.battletag.toLowerCase() === key) {
				return { slot: MatchSlot.A, member };
			}
		}
		for (const member of this.teamBMembers) {
			if (member.member.player.battletag.toLowerCase() === key) {
				return { slot: MatchSlot.B, member };
			}
		}
		return null;
	}
}
