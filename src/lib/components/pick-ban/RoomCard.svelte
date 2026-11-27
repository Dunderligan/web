<script lang="ts">
	import { resolve } from '$app/paths';
	import { MatchSlot, type ListedRoom } from '#lib/types.ts';
	import type { ClassValue } from 'svelte/elements';
	import Icon from '../ui/Icon.svelte';
	import Date from '../ui/Date.svelte';
	import { matchRoster } from '#lib/match.ts';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import StatusIndicator from '../ui/StatusIndicator.svelte';
	import { RoomStatus } from '#lib/pick-ban/index.ts';

	type Props = {
		room: ListedRoom;
		class?: ClassValue;
	};

	let { room, class: classProp }: Props = $props();

	const match = $derived(room.match);

	const { label: statusLabel, icon: statusIcon } = $derived(
		{
			open: { label: 'Inväntar kaptener', icon: 'ph:clock' },
			in_progress: { label: 'Pågående', icon: null },
			finished: { label: 'Avslutat', icon: 'ph:check-circle' },
			cancelled: { label: 'Avbrutet', icon: 'ph:x-circle' }
		}[room.status]
	);
</script>

<a
	class={[
		classProp,
		'flex rounded-lg bg-gray-100 p-4 font-medium hover:bg-gray-200 hover:underline dark:bg-gray-900 dark:hover:bg-gray-800'
	]}
	href={resolve(`pick-ban/${room.id}`)}
>
	<div class="grow space-y-1">
		{@render slot(MatchSlot.A)}
		{@render slot(MatchSlot.B)}
	</div>

	<div class="space-y-1">
		{#if room.match.scheduledAt}
			<div class="flex items-center justify-end gap-2">
				<Icon icon="ph:calendar-blank" />
				<Date date={room.match.scheduledAt} preview="time" />
			</div>
		{/if}

		<div class="flex items-center justify-end gap-2">
			{#if room.status === RoomStatus.IN_PROGRESS}
				<StatusIndicator kind="active" size="sm" />
			{:else if statusIcon}
				<Icon icon={statusIcon} class="text-lg" />
			{/if}

			<span>{statusLabel}</span>
		</div>
	</div>
</a>

{#snippet slot(slot: MatchSlot)}
	{@const roster = matchRoster(match, slot)}

	{#if roster}
		<div class="flex items-center gap-1">
			<RosterLogo id={roster.id} size="sm" />

			<span class="text-lg font-semibold">
				{roster.name}
			</span>
		</div>
	{/if}
{/snippet}
