<script lang="ts">
	import type { ResolvedMatch, MatchRoster } from '$lib/types';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		match: ResolvedMatch;
		seasonSlug: string;
	};

	let { match, seasonSlug }: Props = $props();

	const teamAWon =
		match.played === false ? null : (match.teamAScore ?? 0) > (match.teamBScore ?? 0);
</script>

<div class="flex">
	<div class="grow overflow-hidden rounded-lg">
		{@render side(match.rosterA, teamAWon === true, match.teamAScore)}

		<div class="h-[1px] w-full bg-gray-200"></div>

		{@render side(match.rosterB, teamAWon === false, match.teamBScore)}
	</div>
</div>

{#snippet side(roster?: MatchRoster | null, won?: boolean | null, score?: number | null)}
	<div
		class={[
			'flex h-12 items-center overflow-hidden pr-4',
			match.played ? (won ? 'bg-gray-200' : 'bg-gray-50') : 'bg-gray-100'
		]}
	>
		{#if roster}
			<div
				class={[
					match.played ? 'text-2xl font-extrabold' : 'text-md font-medium',
					won ? 'text-accent-600' : 'text-gray-400',
					'flex h-full shrink-0 items-center justify-center px-4'
				]}
			>
				{score ?? '?'}
			</div>

			<RosterLogo id={roster.id} class="mr-2 size-8" />
			<a
				href="/lag/{seasonSlug}/{roster?.slug}"
				class={[
					match.played
						? won
							? 'font-semibold text-gray-900'
							: 'font-medium text-gray-500'
						: 'font-medium text-gray-800',
					'mr-auto truncate hover:text-accent-600 hover:underline'
				]}
			>
				{roster?.name}
			</a>
		{:else}
			<div class="grow text-center font-medium text-gray-400">???</div>
		{/if}
	</div>
{/snippet}
