<script lang="ts">
	import type { ClassValue, FullMatchWithoutOrder, NestedBracket, NestedGroup } from '$lib/types';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';

	type Props = {
		match: FullMatchWithoutOrder;
		group?: NestedGroup | null;
		bracket?: NestedBracket | null;
		center?: boolean;
		class?: ClassValue;
	};

	let { match, group, bracket, center = false, class: classProp }: Props = $props();

	const division = $derived(group ? group.division : bracket ? bracket.division : null);
</script>

<div
	class={[
		classProp,
		center && 'sm:justify-center',
		'flex items-center gap-4 bg-gray-100 text-sm font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400'
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
