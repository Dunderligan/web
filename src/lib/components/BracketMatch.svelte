<script lang="ts">
	import type { ResolvedMatch, MatchRoster, ClassValue } from '$lib/types';
	import Icon from './Icon.svelte';
	import RosterLogo from './RosterLogo.svelte';

	type Props = {
		match: ResolvedMatch;
		seasonSlug: string;
	};

	let { match, seasonSlug }: Props = $props();

	const teamAWon =
		match.played === false ? null : (match.teamAScore ?? 0) > (match.teamBScore ?? 0);
</script>

<div class="flex flex-col gap-1 overflow-hidden rounded-lg">
	{@render side(match.rosterA, teamAWon === true, match.teamAScore)}

	{@render side(match.rosterB, teamAWon === false, match.teamBScore)}
</div>

{#snippet side(
	roster: MatchRoster | undefined | null,
	won: boolean,
	score: number | undefined | null
)}
	<div class="flex h-14 items-center gap-2 bg-gray-200 pr-1">
		<div
			class={[
				won ? 'bg-accent-600 text-white' : 'text-gray-800',
				'flex h-full items-center justify-center px-4 font-display text-2xl font-extrabold'
			]}
		>
			{score ?? '-'}
		</div>

		{#if roster}
			<RosterLogo id={roster.id} />
		{/if}

		<a
			href="/lag/{seasonSlug}/{roster?.slug}"
			class="grow truncate font-semibold text-gray-800 hover:text-accent-600 hover:underline"
		>
			{roster?.name ?? '?'}
		</a>
	</div>
{/snippet}
