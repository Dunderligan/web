<script lang="ts">
	import {
		matchWinner,
		matchRoster,
		isWinner,
		type MatchSide,
		flipSide,
		matchScore,
		matchNote
	} from '$lib/match';
	import type { ClassValue, ResolvedMatchWithContext } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import MatchInfoRow from './MatchInfoRow.svelte';
	import MatchNote from './MatchNote.svelte';

	type Props = {
		match: ResolvedMatchWithContext;
		seasonSlug?: string;
		mainRosterId?: string;
		hideDivision?: boolean;
	};

	let { match, seasonSlug: seasonSlugProp, mainRosterId, hideDivision = false }: Props = $props();

	const winner = $derived(matchWinner(match));

	// always show main roster on the left
	const flipped = $derived(mainRosterId === match.rosterB?.id);
	const leftTeam = $derived(flipped ? 'B' : 'A');
	const rightTeam = $derived(flipSide(leftTeam));

	const division = $derived(match.group?.division ?? match.bracket?.division ?? null);
	const seasonSlug = $derived(seasonSlugProp ?? division?.season.slug);

	const gradientClass = $derived.by(() => {
		if (!mainRosterId) return null;

		if (winner === leftTeam) {
			return 'bg-linear-to-l to-green-100 dark:to-green-950';
		} else if (winner == rightTeam) {
			return 'bg-linear-to-r to-red-100 dark:to-red-950';
		}
	});
</script>

<div
	class={[
		// gradientClass,
		'relative overflow-hidden rounded-lg bg-gray-100 px-6 py-3 dark:bg-gray-900'
	]}
>
	<MatchInfoRow
		{match}
		group={match.group}
		bracket={match.bracket}
		{hideDivision}
		class="pb-2"
		center
	/>

	<div class="flex flex-col items-center gap-2 sm:flex-row">
		{@render side(leftTeam, {
			root: 'flex-row sm:flex-row-reverse'
		})}

		<div
			class="hidden w-18 shrink-0 text-center text-3xl text-gray-600 sm:block dark:text-gray-400"
		>
			{#if match.played}
				<span class={[winner === leftTeam && 'text-accent-600 dark:text-accent-500', 'font-bold']}
					>{matchScore(match, leftTeam)}
				</span>

				<span class="font-bold">-</span>

				<span class={[winner === rightTeam && 'text-accent-600 dark:text-accent-500', 'font-bold']}
					>{matchScore(match, rightTeam)}</span
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
	{@const note = matchNote(match, side)}

	<div class={[rootClass, 'flex w-full items-center gap-2 text-gray-700 dark:text-gray-300']}>
		{#if roster}
			{@const href = `/lag/${roster.slug}/${seasonSlug}`}

			<RosterLogo id={roster.id} {href} class="size-10 sm:size-12" />

			<a {href} class={[nameClass, 'truncate text-lg font-semibold hover:underline']}>
				{roster.name}
			</a>
		{:else}
			<div class="ml-2 font-medium text-gray-500">Okänt lag</div>
		{/if}

		{#if note}
			<MatchNote {note} />
		{/if}

		{#if won}
			<Icon icon="ph:crown-simple-fill" class="text-xl text-accent-600" title="Vinnare" />
		{/if}

		{#if match.played}
			<div
				class={[
					won ? 'text-accent-600' : 'text-gray-500',
					'ml-auto text-3xl font-extrabold sm:hidden'
				]}
			>
				{matchScore(match, side)}
			</div>
		{/if}
	</div>
{/snippet}
