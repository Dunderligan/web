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
	class={[
		classProp,
		'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(5rem,1fr)_3fr_minmax(5rem,1fr)]'
	]}
>
	<PickBanHeader class="col-span-full" />

	<PickBanTimer class="col-span-full" />

	<PickBanMembersList slot={MatchSlot.A} />

	<PickBanState class="col-span-full row-start-3 lg:col-span-1 lg:row-auto" />

	<PickBanMembersList slot={MatchSlot.B} />

	<PickBanHistory class="col-span-full lg:col-start-2 lg:col-end-2" />
</div>
