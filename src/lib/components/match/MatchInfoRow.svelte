<script lang="ts">
	import { type NestedBracket, type NestedGroup, type MatchWithoutRosters } from '$lib/types';
	import { capitalize, formatDateShort, formatDateTime, formatDateTimeShort } from '$lib/util';
	import type { ClassValue } from 'svelte/elements';
	import Icon from '../ui/Icon.svelte';
	import Link from '../ui/Link.svelte';
	import Tooltip from '../ui/Tooltip.svelte';

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

	const { icon, label, date, showTime } = $derived(
		{
			played: {
				icon: 'ph:check',
				date: match.playedAt ? match.playedAt : 'Okänt datum'
			},
			scheduled: {
				icon: 'ph:calendar-blank',
				date: match.scheduledAt ? match.scheduledAt : null,
				showTime: true
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
		'flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400'
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
			{capitalize(label)}
		{/if}

		{#if date}
			{#if typeof date === 'string'}
				{date}
			{:else}
				<Tooltip underline>
					{#snippet content()}
						<p class="text-center text-lg">
							{formatDateTime(date)}
						</p>
					{/snippet}
					{showTime ? formatDateTimeShort(date) : formatDateShort(date)}
				</Tooltip>
			{/if}
		{/if}
	</div>

	{#if (division && !hideDivision) || match.vodUrl}
		<span class="-mx-2 text-base">—</span>
	{/if}

	{#if division && !hideDivision}
		<Link
			href="/stallningar/{division.season.slug}?div={division.slug}&visa={bracket
				? 'slutspel'
				: 'gruppspel'}"
		>
			{bracket?.name ?? division.name}
		</Link>
	{/if}

	{#if match.vodUrl}
		<Link externalHref={match.vodUrl} openInNewTab>VOD</Link>
	{/if}
</div>
