<script lang="ts">
	import {
		matchWinner,
		matchRoster,
		isWinner,
		matchScoreOrZero,
		type MatchSide,
		matchScore
	} from '$lib/match';
	import type { ResolvedMatch, ClassValue } from '$lib/types';
	import { formatDate, formatDateTime } from '$lib/util';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		match: ResolvedMatch;
		seasonSlug: string;
		flipped?: boolean;
	};

	let { match, seasonSlug, flipped = false }: Props = $props();

	const winner = $derived(matchWinner(match));
</script>

<div class="relative overflow-hidden rounded-lg bg-gray-100 px-6 py-3">
	<div class="flex items-center gap-4 pb-1 text-sm font-medium text-gray-600 sm:justify-center">
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
	</div>
	<div class="flex flex-col items-center gap-2 sm:flex-row">
		{@render side(flipped ? 'B' : 'A', {
			root: 'flex-row sm:flex-row-reverse'
		})}

		<div class="hidden w-18 shrink-0 text-center text-3xl text-gray-600 sm:block">
			{#if match.played}
				<span class={[winner === (flipped ? 'B' : 'A') && 'text-accent-600', 'font-bold']}
					>{matchScoreOrZero(match, flipped ? 'B' : 'A')}
				</span>

				<span class="font-bold">-</span>

				<span class={[winner === (flipped ? 'A' : 'B') && 'text-accent-600', 'font-bold']}
					>{matchScoreOrZero(match, flipped ? 'A' : 'B')}</span
				>
			{:else}
				<span class="font-semibold">? - ?</span>
			{/if}
		</div>

		{@render side(flipped ? 'A' : 'B')}
	</div>
</div>

{#snippet side(
	side: MatchSide,
	{ root: rootClass, name: nameClass }: { root?: ClassValue; name?: ClassValue } = {}
)}
	{@const roster = matchRoster(match, side)}
	{@const won = roster && isWinner(match, side)}

	<div class={[rootClass, 'flex w-full items-center gap-2']}>
		{#if roster}
			<RosterLogo id={roster.id} class="size-10 sm:size-12" />

			<a
				href="/lag/{roster.slug}/{seasonSlug}"
				class={[
					nameClass,
					won ? 'text-gray-800' : 'text-gray-600',
					'truncate text-lg font-semibold hover:text-accent-600 hover:underline'
				]}
			>
				{roster.name}
			</a>

			{#if won}
				<Icon icon="ph:crown-simple-fill" class="text-xl text-accent-600" />
			{/if}

			{#if match.played}
				<div
					class={[
						won ? 'text-accent-600' : 'text-gray-600',
						'ml-auto text-3xl font-extrabold sm:hidden'
					]}
				>
					{matchScoreOrZero(match, side)}
				</div>
			{/if}
		{/if}
	</div>
{/snippet}
