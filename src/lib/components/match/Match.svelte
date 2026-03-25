<script lang="ts">
	import {
		matchWinner,
		matchRoster,
		isWinner,
		type MatchSide,
		flipSide,
		matchScore,
		matchNote,
		hasMatchScore
	} from '$lib/match';
	import { MatchState, type ClassValue, type ResolvedMatchWithContext } from '$lib/types';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import MatchInfoRow from './MatchInfoRow.svelte';
	import MatchNote from '../ui/Note.svelte';
	import { shortenTeamName } from '$lib/util';
	import Button from '../ui/Button.svelte';
	import { PreferencesState } from '$lib/state/preferences.svelte';

	type Props = {
		match: ResolvedMatchWithContext;
		seasonSlug?: string;
		mainRosterId?: string;
		hideDivision?: boolean;
		short?: boolean;
	};

	let {
		match,
		seasonSlug: seasonSlugProp,
		mainRosterId,
		hideDivision = false,
		short = false
	}: Props = $props();

	const prefs = PreferencesState.get();

	const winner = $derived(matchWinner(match));

	// always show main roster on the left
	const flipped = $derived(mainRosterId === match.rosterB?.id);
	const leftSide = $derived(flipped ? 'B' : 'A');
	const rightSide = $derived(flipSide(leftSide));

	const division = $derived(match.group?.division ?? match.bracket?.division ?? null);
	const seasonSlug = $derived(seasonSlugProp ?? division?.season.slug);

	const SPOILER_MODE_DURATION = 1000 * 60 * 60 * 24 * 14; // 14 days

	let spoiler = $derived.by(() => {
		if (!prefs.spoilerMode) return false;
		if (!match.playedAt) return false;

		const timeSince = Date.now() - new Date(match.playedAt).getTime();
		return timeSince < SPOILER_MODE_DURATION;
	});

	const shownState = $derived.by(() => {
		if (match.state === MatchState.SCHEDULED) return 'scheduled';
		if (match.state === MatchState.CANCELLED) return 'cancelled';
		if (spoiler) return 'spoiler';
		return 'score';
	});
</script>

<div class={['relative rounded-lg bg-gray-100 px-6 py-3 dark:bg-gray-900']}>
	<MatchInfoRow
		{match}
		{short}
		{hideDivision}
		group={match.group}
		bracket={match.bracket}
		class="pb-2"
		center
	/>

	<div class="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
		{@render side({ side: leftSide, class: 'flex-row sm:flex-row-reverse', showSpoiler: true })}

		<div
			class={[
				short ? 'w-10' : 'w-20',
				'hidden items-center justify-center gap-2 text-3xl text-gray-600 sm:flex dark:text-gray-400'
			]}
		>
			{#if shownState === 'scheduled'}
				<span class="text-3xl font-semibold">/</span>
			{:else if shownState === 'cancelled'}
				<span class="text-3xl font-semibold">x - x</span>
			{:else if shownState === 'spoiler'}
				{@render spoilerButton({ class: 'h-full' })}
			{:else}
				<span class={[winner === leftSide && 'text-accent-600 dark:text-accent-500', 'font-bold']}
					>{matchScore(match, leftSide)}
				</span>

				<span class="font-bold">-</span>

				<span class={[winner === rightSide && 'text-accent-600 dark:text-accent-500', 'font-bold']}
					>{matchScore(match, rightSide)}</span
				>
			{/if}
		</div>

		{@render side({ side: rightSide })}
	</div>
</div>

{#snippet side({
	side,
	class: classProp,
	showSpoiler
}: {
	side: MatchSide;
	class?: ClassValue;
	showSpoiler?: boolean;
})}
	{@const roster = matchRoster(match, side)}
	{@const won = roster && isWinner(match, side)}
	{@const note = matchNote(match, side)}

	<div
		class={[classProp, 'flex items-center gap-3 overflow-hidden text-gray-700 dark:text-gray-300']}
	>
		{#if roster}
			{@const href = `/lag/${roster.slug}/${seasonSlug}`}

			<RosterLogo id={roster.id} {href} class="size-10 sm:size-12" />

			<a {href} class={[short && 'shrink-0', 'truncate text-lg font-semibold hover:underline']}>
				{short ? shortenTeamName(roster.name) : roster.name}
			</a>
		{:else}
			<Icon icon="ph:minus-circle" class="shrink-0 text-4xl text-gray-600 dark:text-gray-400" />

			<div class="text-lg font-semibold text-gray-600 dark:text-gray-400">TBD</div>
		{/if}

		{#if note && !short}
			<MatchNote content={note} />
		{/if}

		{#if won && !spoiler}
			<Icon icon="ph:crown-simple-fill" class="text-xl text-accent-600" title="Vinnare" />
		{/if}

		{#if shownState === 'spoiler' && showSpoiler}
			{@render spoilerButton({ class: 'ml-auto sm:hidden!' })}
		{:else if shownState === 'score'}
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

{#snippet spoilerButton({ class: classProp }: { class?: ClassValue } = {})}
	<Button
		icon="ph:eye-slash-fill"
		onclick={() => (spoiler = false)}
		class={[classProp, 'px-6 text-lg']}
		kind="secondary"
	/>
{/snippet}
