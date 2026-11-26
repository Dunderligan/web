<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ListedRoom } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import Icon from '../ui/Icon.svelte';
	import Date from '../ui/Date.svelte';

	type Props = {
		room: ListedRoom;
		class?: ClassValue;
	};

	let { room, class: classProp }: Props = $props();
</script>

<a
	class={[classProp, 'grid grid-cols-[1fr_auto] rounded-lg bg-gray-50 p-4 font-medium']}
	href={resolve(`/pick-ban/${room.id}`)}
>
	<div>{room.match.rosterA?.name}</div>

	{#if room.match.scheduledAt}
		<div class="flex items-center gap-2">
			<Icon icon="ph:calendar-blank" />
			<Date date={room.match.scheduledAt} preview="time" />
		</div>
	{/if}

	<div>{room.match.rosterB?.name}</div>
</a>
