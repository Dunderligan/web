<script lang="ts">
	import { RoomStatus } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import type { ClassValue } from 'svelte/elements';
	import PickBanCancelledState from './PickBanCancelledState.svelte';
	import PickBanFinishedState from './PickBanFinishedState.svelte';
	import PickBanInProgressState from './PickBanInProgressState.svelte';
	import PickBanOpenState from './PickBanOpenState.svelte';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<div
	class={[
		classProp,
		'flex min-h-96 flex-col items-center justify-center gap-4 rounded-xl border-[3px] border-gray-200 bg-white p-6 text-center font-medium text-gray-600 dark:text-gray-400'
	]}
>
	{#if context.status === RoomStatus.CANCELLED}
		<PickBanCancelledState />
	{:else if context.status === RoomStatus.FINISHED}
		<PickBanFinishedState />
	{:else if context.status === RoomStatus.IN_PROGRESS}
		<PickBanInProgressState />
	{:else if context.status === RoomStatus.OPEN}
		<PickBanOpenState />
	{/if}
</div>
