<script lang="ts">
	import type { BaseEntity, MatchRoster, TournamentState } from '$lib/types';
	import { onMount } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Button from '../ui/Button.svelte';
	import PageSectionAlternate from './PageSectionAlternate.svelte';

	type Props = {
		state: TournamentState;
	};

	let { state: tournamentState }: Props = $props();

	const season = $derived(tournamentState.season);

	const style = $derived.by(() => {
		switch (tournamentState.status) {
			case 'offseason':
				return 'muted';

			case 'registration':
				return 'accent';

			case 'ongoing':
			case 'starting':
			case 'upcoming':
				return 'neutral';
		}
	});

	const hasCountdown = $derived.by(() => {
		switch (tournamentState.status) {
			case 'registration':
				return tournamentState.registrationClosesAt !== null;
			case 'upcoming':
				return tournamentState.registrationOpensAt !== null;
			default:
				return false;
		}
	});

	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<PageSectionAlternate {style} class={[hasCountdown && 'text-center']}>
	{#if tournamentState.status === 'offseason'}
		<h2 class="font-display text-4xl font-bold">Off-season</h2>
		<h4 class="mt-1 text-lg font-medium">Tack för denna säsong! Ses igen nästa år!</h4>

		<div class="mt-10 grid grid-cols-1 justify-center gap-4 sm:grid-cols-2">
			{#each tournamentState.winners as { bracket, roster } (roster.id)}
				{@render winner(bracket, roster)}
			{/each}
		</div>
	{:else if tournamentState.status === 'ongoing'}
		<h2 class="font-display text-4xl font-bold">{season.name} är igång!</h2>
	{:else if tournamentState.status === 'registration'}
		<h4 class="text-xl font-semibold">
			Anmälningar till {season.name} är öppna!
		</h4>

		{#if tournamentState.registrationClosesAt}
			{@render countdown(tournamentState.registrationClosesAt)}
		{/if}

		<Button
			icon="ph:arrow-right"
			label="Anmäl ditt lag"
			kind="secondary"
			class="mt-12 text-lg"
			href="/anmal/{season.slug}"
		/>
	{:else if tournamentState.status === 'upcoming'}
		<h4 class="text-xl font-semibold">
			Anmälningar till {season.name} öppnar snart!
		</h4>

		{#if tournamentState.registrationOpensAt}
			{@render countdown(tournamentState.registrationOpensAt)}
		{/if}
	{:else if tournamentState.status === 'starting'}
		<h2 class="font-display text-4xl font-bold">{season.name} startar snart!</h2>
	{/if}
</PageSectionAlternate>

{#snippet countdown(endDate: Date)}
	{@const diff = new Date(endDate.getTime() - now)}

	<div class="mx-auto mt-10 flex max-w-3xl text-5xl font-bold sm:text-6xl md:text-7xl">
		{@render digit(diff.getUTCDate() - 1, 'Dagar', true)}
		{@render digit(diff.getUTCHours(), 'Timmar')}
		{@render digit(diff.getUTCMinutes(), 'Minuter')}
		{@render digit(diff.getUTCSeconds(), 'Sekunder')}
	</div>
{/snippet}

{#snippet digit(count: number, label: string, isFirst = false)}
	{#if !isFirst}
		<div class="grow font-display">:</div>
	{/if}

	<div class="grow basis-0">
		<div class="font-display">{count.toString().padStart(2, '0')}</div>
		<div class="mt-3 text-lg font-medium">{label}</div>
	</div>
{/snippet}

{#snippet winner(bracket: BaseEntity, roster: MatchRoster)}
	{@const href = `/lag/${roster.slug}/${tournamentState.season.slug}`}

	<div class="flex items-center gap-3 rounded-lg bg-gray-700 px-6 py-4 dark:bg-gray-800">
		<RosterLogo id={roster.id} class="size-14" {href} />
		<div class="text-left">
			<div class="font-medium text-gray-300">Vinnare {bracket.name}</div>
			<a {href} class="-mt-1 block text-xl font-semibold hover:underline">{roster.name}</a>
		</div>

		<Icon icon="ph:crown-simple-fill" class="mr-2 ml-auto text-2xl" />
	</div>
{/snippet}
