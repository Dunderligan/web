<script lang="ts">
	import type { ResolvedPickBanConfig, RoomState, RuleCatalog } from '$lib/pick-ban';
	import type { MemberWithProfile, ResolvedMatchWithContext } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import PickBanHeader from './PickBanHeader.svelte';
	import PickBanTimer from './PickBanTimer.svelte';
	import { onMount } from 'svelte';
	import PickBanMembersList from './PickBanMembersList.svelte';

	type Props = {
		state: RoomState;
		catalog: RuleCatalog;
		config: ResolvedPickBanConfig;
		match: ResolvedMatchWithContext;
		teamAMembers: MemberWithProfile[];
		teamBMembers: MemberWithProfile[];
		class?: ClassValue;
	};

	let {
		state: roomState,
		catalog,
		config,
		match,
		teamAMembers,
		teamBMembers,
		class: classProp
	}: Props = $props();

	let now: Date = $state(new Date());

	const deadlineInMillis = $derived.by(() => {
		const decisionDeadline = roomState.nextDeadlineAt;
		if (!decisionDeadline) return null;

		const diff = decisionDeadline.getTime() - now.getTime();
		return Math.max(diff, 0);
	});

	onMount(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 100);

		return () => clearInterval(interval);
	});
</script>

<div class={[classProp, 'grid grid-cols-[1fr_2fr_1fr] gap-x-2 gap-y-4']}>
	<PickBanHeader state={roomState} {match} {config} class="col-span-3" />

	<PickBanTimer max={30} value={30 - ((now.getTime() / 1000) % 30)} class="col-span-3" />
	<!--<PickBanTimer max={config.decisionTimeoutSeconds * 1000} value={deadlineInMillis} />-->

	<PickBanMembersList members={teamAMembers} />

	<div class="rounded-xl border-[3px] border-gray-200 p-6"></div>

	<PickBanMembersList members={teamBMembers} />
</div>
