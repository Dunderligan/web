<script lang="ts">
	import {
		matchWinner,
		matchRoster,
		isWinner,
		matchScoreOrZero,
		type MatchSide,
		flipSide
	} from '$lib/match';
	import type { ClassValue, ResolvedMatchWithContext } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import MatchInfoRow from './MatchInfoRow.svelte';

	type Props = {
		match: ResolvedMatchWithContext;
		seasonSlug?: string;
		flipped?: boolean;
	};

	let { match, seasonSlug: seasonSlugProp, flipped = false }: Props = $props();

	const winner = $derived(matchWinner(match));

	const leftTeam = $derived(flipped ? 'B' : 'A');
	const rightTeam = $derived(flipSide(leftTeam));

	const division = $derived(match.group?.division ?? match.bracket?.division ?? null);
	const seasonSlug = $derived(seasonSlugProp ?? division?.season.slug);
</script>

<div class="relative overflow-hidden rounded-lg bg-gray-100 px-6 py-3 dark:bg-gray-900">
	<MatchInfoRow {match} group={match.group} bracket={match.bracket} class="pb-2" center />

	<div class="flex flex-col items-center gap-2 sm:flex-row">
		{@render side(leftTeam, {
			root: 'flex-row sm:flex-row-reverse'
		})}

		<div
			class="hidden w-18 shrink-0 text-center text-3xl text-gray-500 sm:block dark:text-gray-400"
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
				<span class="font-semibold">---</span>
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

	<div class={[rootClass, 'flex w-full items-center gap-2 text-gray-800 dark:text-gray-100']}>
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
			<div
				class={[
					won ? 'text-accent-600' : 'text-gray-500',
					'ml-auto text-3xl font-extrabold sm:hidden'
				]}
			>
				{matchScoreOrZero(match, side)}
			</div>
		{/if}
	</div>
{/snippet}
