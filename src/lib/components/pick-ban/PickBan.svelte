<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import PickBanHeader from './PickBanHeader.svelte';
	import PickBanTimer from './PickBanTimer.svelte';
	import PickBanMembersList from './PickBanMembersList.svelte';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MatchSlot } from '$lib/types';
	import PickBanHistory from './PickBanHistory.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<div class={[classProp, 'grid grid-cols-[1fr_3fr_1fr] gap-3']}>
	<PickBanHeader class="col-span-3" />

	<PickBanTimer
		max={context.config.decisionTimeoutSeconds * 1000}
		value={context.deadlineInMillis}
		class="col-span-3"
	/>

	<PickBanMembersList slot={MatchSlot.A} />

	<div class="rounded-xl border-[3px] border-gray-200 p-6"></div>

	<PickBanMembersList slot={MatchSlot.B} />

	<div></div>

	<PickBanHistory />

	<div></div>
</div>
