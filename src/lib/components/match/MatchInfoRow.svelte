<script lang="ts">
	import {
		type ClassValue,
		type NestedBracket,
		type NestedGroup,
		type MatchWithoutRosters
	} from '$lib/types';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		match: MatchWithoutRosters;
		group?: NestedGroup | null;
		bracket?: NestedBracket | null;
		center?: boolean;
		hideDivision?: boolean;
		class?: ClassValue;
		short?: boolean;
	};

	let {
		match,
		group,
		bracket,
		center = false,
		class: classProp,
		hideDivision = false,
		short = false
	}: Props = $props();

	const division = $derived(group ? group.division : bracket ? bracket.division : null);

	const { icon, label, date } = $derived(
		{
			played: {
				icon: 'ph:check',
				date: match.playedAt ? formatDate(match.playedAt) : 'Okänt datum'
			},
			scheduled: {
				icon: 'ph:calendar-blank',
				label: 'Planerad',
				date: match.scheduledAt ? formatDateTime(match.scheduledAt) : null
			},
			walkover: { icon: 'ph:flag', label: 'Walkover' },
			cancelled: { icon: 'ph:x', label: 'Inställd' }
		}[match.state]
	);
</script>

<div
	class={[
		classProp,
		center && 'sm:justify-center',
		'flex items-center gap-4 text-sm font-semibold text-gray-600 dark:text-gray-400'
	]}
>
	{#if bracket}
		<Icon icon="ph:trophy" title="Slutspelsmatch" class="mb-0.5" />
	{/if}

	<div>
		{#if icon}
			<Icon {icon} />
		{/if}

		{#if label && !short}
			{label}
		{/if}

		{#if date}
			{date}
		{/if}
	</div>

	{#if (division && !hideDivision) || match.vodUrl}
		<span class="-mx-1.5 text-base">•</span>
	{/if}

	{#if division && !hideDivision}
		<a
			href="/stallningar/{division.season.slug}?div={division.slug}&visa={bracket
				? 'slutspel'
				: 'gruppspel'}"
			class="hover:underline"
		>
			{bracket?.name ?? division.name}
		</a>
	{/if}

	{#if match.vodUrl}
		<a class="hover:underline" href={match.vodUrl} target="_blank" rel="noopener noreferrer">
			<Icon icon="ph:arrow-square-out" />
			VOD
		</a>
	{/if}
</div>
