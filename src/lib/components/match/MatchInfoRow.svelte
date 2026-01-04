<script lang="ts">
	import type { ClassValue, FullMatchWithoutOrder, NestedBracket, NestedGroup } from '$lib/types';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		match: FullMatchWithoutOrder;
		group?: NestedGroup | null;
		bracket?: NestedBracket | null;
		center?: boolean;
		hideDivision?: boolean;
		class?: ClassValue;
	};

	let {
		match,
		group,
		bracket,
		center = false,
		class: classProp,
		hideDivision = false
	}: Props = $props();

	const division = $derived(group ? group.division : bracket ? bracket.division : null);
</script>

<div
	class={[
		classProp,
		center && 'sm:justify-center',
		'flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400'
	]}
>
	{#if bracket}
		<Icon icon="ph:trophy" title="Slutspelsmatch" class="mb-1" />
	{/if}

	{#if match.played}
		<div>
			{match.playedAt ? formatDate(match.playedAt) : 'Okänt datum'}
		</div>

		{#if match.vodUrl}
			<a class="hover:underline" href={match.vodUrl} target="_blank" rel="noopener noreferrer">
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

	{#if division && !hideDivision}
		<a
			href="/stallningar/{division.season.slug}?div={division.slug}&visa={bracket
				? 'slutspel'
				: 'gruppspel'}"
			class="hover:underline"
		>
			<Icon icon="ph:link" />
			{bracket?.name ?? division.name}
		</a>
	{/if}
</div>
