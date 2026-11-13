import {
	matchProgress,
	nextDecisionPoint,
	type ResolvedPickBanConfig,
	type RoomState,
	type RuleCatalog
} from '$lib/pick-ban';
import type { User } from '$lib/server/db/schema/auth';
import { MatchSlot, type MemberWithProfile, type ResolvedMatchWithContext } from '$lib/types';
import { SvelteDate } from 'svelte/reactivity';
import { defineContext } from './util';
import { subscribeToRoom } from '$lib/remote/pick-ban.remote';

const { get, set } = defineContext<PickBanContext>('$_pick_ban_state');

export type ConnectionState = 'connected' | 'loading' | 'disconnected';

export class PickBanContext {
	static get = get;
	static set = set;

	roomId: string;
	catalog: RuleCatalog;
	config: ResolvedPickBanConfig;
	match: ResolvedMatchWithContext;
	teamAMembers: MemberWithProfile[];
	teamBMembers: MemberWithProfile[];
	state: RoomState;
	user: User | null;

	now: SvelteDate;

	#nowInterval: NodeJS.Timeout;
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
		return this.#findMemberByBattletag(this.user.battletag);
	});

	userSlot = $derived.by(() => this.#userInfo?.slot ?? null);
	userMember = $derived.by(() => this.#userInfo?.member ?? null);
	userIsCaptain = $derived.by(() => this.#userInfo?.member.member.isCaptain ?? false);

	constructor({
		roomId,
		catalog,
		config,
		match,
		teamAMembers,
		teamBMembers,
		initialState,
		user
	}: {
		roomId: string;
		catalog: RuleCatalog;
		config: ResolvedPickBanConfig;
		match: ResolvedMatchWithContext;
		teamAMembers: MemberWithProfile[];
		teamBMembers: MemberWithProfile[];
		initialState: RoomState;
		user: User | null;
	}) {
		this.roomId = roomId;
		this.catalog = catalog;
		this.config = config;
		this.match = match;
		this.teamAMembers = teamAMembers;
		this.teamBMembers = teamBMembers;
		this.state = $state(initialState);
		this.user = user;
		this.now = $state(new SvelteDate());

		this.#nowInterval = setInterval(() => {
			this.now = new SvelteDate();
		}, 1000);

		this.#liveQuery = subscribeToRoom({ roomId: this.roomId });

		this.#listenToLiveQuery();
	}

	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;

		clearInterval(this.#nowInterval);
	}

	async #listenToLiveQuery() {
		for await (const state of this.#liveQuery) {
			if (this.#destroyed) break;

			this.state = state;
		}
	}

	#findMemberByBattletag(battletag: string): { slot: MatchSlot; member: MemberWithProfile } | null {
		for (const member of this.teamAMembers) {
			if (member.member.player.battletag === battletag) {
				return { slot: MatchSlot.A, member };
			}
		}
		for (const member of this.teamBMembers) {
			if (member.member.player.battletag === battletag) {
				return { slot: MatchSlot.B, member };
			}
		}
		return null;
	}
}
