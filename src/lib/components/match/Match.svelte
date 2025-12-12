<script lang="ts">
	import {
		matchWinner,
		matchRoster,
		isWinner,
		matchScoreOrZero,
		type MatchSide,
		flipSide
	} from '$lib/match';
	import type { ResolvedMatch, ClassValue, NestedDivision, NestedGroup } from '$lib/types';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		match: ResolvedMatch;
		division?: NestedDivision | null;
		group?: NestedGroup | null;
		seasonSlug?: string;
		flipped?: boolean;
	};

	let {
		match,
		division: divisionProp,
		group,
		seasonSlug: seasonSlugProp,
		flipped = false
	}: Props = $props();

	const winner = $derived(matchWinner(match));

	const leftTeam = $derived(flipped ? 'B' : 'A');
	const rightTeam = $derived(flipSide(leftTeam));

	const isBracketMatch = $derived(divisionProp ? true : group ? false : null);
	const division = $derived(divisionProp ?? group?.division);
	const seasonSlug = $derived(seasonSlugProp ?? division?.season.slug);
</script>

<div class="relative overflow-hidden rounded-lg bg-gray-100 px-6 py-3 dark:bg-gray-900">
	<div
		class="flex items-center gap-4 pb-1 text-sm font-medium text-gray-600 sm:justify-center dark:text-gray-400"
	>
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
				{division.name},
				{division.season.name}
			</a>
		{/if}
	</div>
	<div class="flex flex-col items-center gap-2 sm:flex-row">
		{@render side(leftTeam, {
			root: 'flex-row sm:flex-row-reverse'
		})}

		<div
			class="hidden w-18 shrink-0 text-center text-3xl text-gray-800 sm:block dark:text-gray-400"
		>
			{#if match.played}
				<span class={[winner === leftTeam && 'text-accent-600 dark:text-accent-500', 'font-bold']}
					>{matchScoreOrZero(match, leftTeam)}
				</span>

				<span class="font-bold">-</span>

				<span class={[winner === rightTeam && 'text-accent-600 dark:text-accent-500', 'font-bold']}
					>{matchScoreOrZero(match, rightTeam)}</span
				>
			{:else}
				<span class="font-semibold">?</span>
			{/if}
		</div>

		{@render side(rightTeam)}
	</div>
</div>

{#snippet side(
	side: MatchSide,
	{ root: rootClass, name: nameClass }: { root?: ClassValue; name?: ClassValue } = {}
)}
	{@const roster = matchRoster(match, side)}
	{@const won = roster && isWinner(match, side)}

	<div class={[rootClass, 'flex w-full items-center gap-2 text-gray-800 dark:text-gray-300']}>
		{#if roster}
			<RosterLogo id={roster.id} class="size-10 sm:size-12" />

			<a
				href="/lag/{roster.slug}/{seasonSlug}"
				class={[nameClass, 'truncate text-lg font-semibold hover:underline']}
			>
				{roster.name}
			</a>
		{:else}
			<div class="ml-2 font-medium text-gray-500">
				{#if match.played}
					W/O
				{:else}
					Okänt lag
				{/if}
			</div>
		{/if}

		{#if won}
			<Icon icon="ph:crown-simple-fill" class="text-xl text-accent-600" />
		{/if}

		{#if match.played}
			<div class={[won && 'text-accent-600', 'ml-auto text-3xl font-extrabold sm:hidden']}>
				{matchScoreOrZero(match, side)}
			</div>
		{/if}
	</div>
{/snippet}
