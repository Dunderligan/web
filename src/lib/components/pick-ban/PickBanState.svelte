<script lang="ts">
	import { RoomStatus } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import type { ClassValue } from 'svelte/elements';

	type Props = {
		class?: ClassValue;
	};

	let { class: classProp }: Props = $props();

	const context = PickBanContext.get();
</script>

<div class={[classProp, 'min-h-96 rounded-xl border-[3px] border-gray-200 bg-white p-6']}>
	{#if context.status === RoomStatus.CANCELLED}

	{:else if context.status === RoomStatus.FINISHED}

	{:else if context.status === RoomStatus.IN_PROGRESS}

	{:else if context.status === RoomStatus.OPEN}

	{:else if context.status === RoomStatus.READY_CHECK}

	{/if}
</div>
