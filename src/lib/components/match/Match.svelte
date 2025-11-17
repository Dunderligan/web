<script lang="ts">
	import type { ResolvedMatch, MatchRoster, ClassValue } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		match: ResolvedMatch;
		seasonSlug: string;
	};

	let { match, seasonSlug }: Props = $props();

	const teamAWon =
		match.played === false ? null : (match.teamAScore ?? 0) > (match.teamBScore ?? 0);
</script>

<div class="relative overflow-hidden rounded-lg bg-gray-100 px-6 py-3">
	<div class="flex items-center gap-4 pb-2 text-sm font-medium text-gray-600 sm:justify-center">
		{#if match.played}
			{#if match.playedAt}
				<div>
					Spelad

					{match.playedAt.toLocaleDateString()}
				</div>
			{/if}

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
					{match.scheduledAt.toLocaleString()}
				{/if}
			</div>
		{/if}
	</div>
	<div class="flex flex-col items-center gap-2 sm:flex-row">
		{#if match.rosterA}
			{@render side(match.rosterA, teamAWon === true, match.teamAScore, {
				root: 'flex-row sm:flex-row-reverse'
			})}
		{/if}

		<div class="mx-2 hidden shrink-0 text-3xl text-gray-600 sm:block">
			{#if match.played}
				<span class={[teamAWon && 'text-accent-600', 'font-extrabold']}
					>{match.teamAScore ?? 0}
				</span>
				<span class="font-bold">-</span>
				<span class={[!teamAWon && 'text-accent-600', 'font-extrabold']}
					>{match.teamBScore ?? 0}</span
				>
			{:else}
				<span class="font-semibold">? - ?</span>
			{/if}
		</div>

		{#if match.rosterB}
			{@render side(match.rosterB, teamAWon === false, match.teamBScore, { root: '' })}
		{/if}
	</div>
</div>

{#snippet side(
	roster: MatchRoster,
	won: boolean,
	score?: number | null,
	classes?: { root?: ClassValue; name?: ClassValue }
)}
	<div class={[classes?.root, 'flex w-full items-center gap-2']}>
		<RosterLogo id={roster.id} class="size-10 sm:size-12" />

		<a
			href="/lag/{roster.slug}/{seasonSlug}"
			class={[
				classes?.name,
				'truncate text-lg font-semibold text-gray-700 hover:text-accent-600 hover:underline'
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
				{score ?? 0}
			</div>
		{/if}
	</div>
{/snippet}
