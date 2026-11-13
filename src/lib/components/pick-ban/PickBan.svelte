<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import PickBanHeader from './PickBanHeader.svelte';
	import PickBanTimer from './PickBanTimer.svelte';
	import PickBanMembersList from './PickBanMembersList.svelte';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import { MatchSlot } from '$lib/types';
	import PickBanHistory from './PickBanHistory.svelte';
	import PickBanState from './PickBanState.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<div class={[classProp, 'grid grid-cols-[minmax(8rem,1fr)_3fr_minmax(8rem,1fr)] gap-3']}>
	<PickBanHeader class="col-span-3" />

	<PickBanTimer
		max={context.config.decisionTimeoutSeconds * 1000}
		value={context.deadlineInMillis}
		class="col-span-3"
	/>

	<PickBanMembersList slot={MatchSlot.A} />

	<PickBanState />

	<PickBanMembersList slot={MatchSlot.B} />

	<div></div>

	<PickBanHistory />

	<div></div>
</div>
