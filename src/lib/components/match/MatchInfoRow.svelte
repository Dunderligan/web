<script lang="ts">
	import type { ClassValue, FullMatchWithoutOrder, NestedDivision } from '$lib/types';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		match: FullMatchWithoutOrder;
		division?: NestedDivision | null;
		isBracketMatch?: boolean | null;
		center?: boolean;
		class?: ClassValue;
	};

	let { match, division, isBracketMatch, center = false, class: classProp }: Props = $props();
</script>

<div
	class={[
		classProp,
		center && 'sm:justify-center',
		'flex items-center gap-4 bg-gray-100 text-sm font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400'
	]}
>
	{#if isBracketMatch}
		<Icon icon="ph:trophy" title="Slutspelsmatch" />
	{/if}

	{#if match.played}
		<div>
			{match.playedAt ? formatDate(match.playedAt) : 'Okänt datum'}
		</div>

		{#if match.vodUrl}
			<a class="hover:underline" href={match.vodUrl}>
				<Icon icon="ph:arrow-square-out" />
				VOD
			</a>
		{/if}
	{:else}
		<div>
			<Icon icon="ph:calendar-blank" />
			Planerad

			{#if match.scheduledAt}
				{formatDateTime(match.scheduledAt)}
			{/if}
		</div>
	{/if}

	{#if division}
		<a
			href="/stallningar/{division.season.slug}?div={division.slug}&visa={isBracketMatch
				? 'slutspel'
				: 'gruppspel'}"
			class="hover:underline"
		>
			<Icon icon="ph:link" />
			{division.name}
		</a>
	{/if}
</div>
