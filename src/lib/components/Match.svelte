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

<div
	class="relative flex items-center gap-4 overflow-hidden rounded-lg bg-gray-200 px-6 py-3 text-lg"
>
	{#if teamAWon !== null}
		<div class={['absolute h-full w-2 bg-accent-600', teamAWon ? 'left-0' : 'right-0']}></div>
	{/if}

	{#if match.rosterA}
		{@render side(match.rosterA, teamAWon === true, { name: 'text-right' })}
	{/if}

	<div class="shrink-0 rounded-lg bg-white px-3 py-1.5 font-display text-xl font-extrabold">
		{#if match.played === false}
			? - ?
		{:else}
			{match.teamAScore ?? 0} - {match.teamBScore ?? 0}
		{/if}
	</div>

	{#if match.rosterB}
		{@render side(match.rosterB, teamAWon === false, { root: 'flex-row-reverse' })}
	{/if}
</div>

{#snippet side(
	roster: MatchRoster,
	won: boolean,
	classes: { root?: ClassValue; name?: ClassValue }
)}
	<div class={[classes.root, 'flex w-full items-center']}>
		<RosterLogo id={roster.id} />

		{#if won}
			<Icon icon="mdi:crown" class="mx-2 text-2xl text-accent-600" />
		{/if}

		<a
			href="/lag/{seasonSlug}/{roster.slug}"
			class={[
				classes.name,
				'grow font-semibold text-gray-800 hover:text-accent-600 hover:underline'
			]}
		>
			{roster.name}
		</a>
	</div>
{/snippet}
