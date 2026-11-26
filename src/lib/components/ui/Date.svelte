<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import Tooltip from './Tooltip.svelte';
	import { formatDateShort, formatDateTime, formatDateTimeShort, formatTime } from '$lib/util';

	type Props = {
		date: Date;
		preview?: 'time' | 'date' | 'datetime';
		class?: ClassValue;
	};

	let { date, preview = 'date', class: classProp }: Props = $props();

	const previewText = $derived(
		{
			time: formatTime(date),
			date: formatDateShort(date),
			datetime: formatDateTimeShort(date)
		}[preview]
	);
</script>

<Tooltip underline class={classProp}>
	{#snippet content()}
		<p class="text-center text-lg">
			{formatDateTime(date)}
		</p>
	{/snippet}
	<date>
		{previewText}
	</date>
</Tooltip>
