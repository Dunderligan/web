<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import PickBanHeader from './PickBanHeader.svelte';
	import PickBanTimer from './PickBanTimer.svelte';
	import PickBanMembersList from './PickBanMembersList.svelte';
	import { MatchSlot } from '$lib/types';
	import PickBanHistory from './PickBanHistory.svelte';
	import PickBanState from './PickBanState.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();
</script>

<div
	class={[classProp, 'grid grid-cols-1 gap-3 md:grid-cols-[minmax(8rem,1fr)_3fr_minmax(8rem,1fr)]']}
>
	<PickBanHeader class="col-span-3" />

	<PickBanTimer class="col-span-3" />

	<PickBanMembersList slot={MatchSlot.A} />
	<PickBanState />
	<PickBanMembersList slot={MatchSlot.B} />

	<div></div>
	<PickBanHistory />
	<div></div>
</div>
