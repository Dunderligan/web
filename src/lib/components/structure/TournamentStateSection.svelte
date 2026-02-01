<script lang="ts">
	import type { TournamentState } from '$lib/types';
	import { onMount } from 'svelte';
	import Icon from '../ui/Icon.svelte';
	import RosterLogo from '../ui/RosterLogo.svelte';
	import Button from '../ui/Button.svelte';
	import { discordUrl } from '$lib/util';

	type Props = {
		state: TournamentState;
	};

	let { state: tournamentState }: Props = $props();

	const season = $derived(tournamentState.season);

	const statusClass = $derived.by(() => {
		switch (tournamentState.status) {
			case 'offseason':
				return 'bg-gray-600 text-white dark:bg-gray-900 dark:text-gray-200';

			case 'registration':
				return 'bg-accent-700 text-accent-100 dark:bg-accent-900 dark:text-accent-200';

			case 'starting':
			case 'upcoming':
			case 'ongoing':
				return 'bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

<section class={['relative z-0 grow overflow-hidden px-4 py-20', statusClass]}>
	<div class="mx-auto max-w-3xl text-center">
		{#if tournamentState.status === 'offseason'}
			<h2 class="font-display text-4xl font-bold">Off-season</h2>
			<h4 class="mt-1 text-lg font-medium">Tack för denna säsong! Ses igen nästa år!</h4>

			<div class="mt-10 grid grid-cols-1 justify-center gap-4 sm:grid-cols-2">
				{#each tournamentState.winners as { bracket, roster } (roster.id)}
					{@const href = `/lag/${roster.slug}/${tournamentState.season.slug}`}

					<div class="flex items-center gap-3 rounded-lg bg-gray-700 px-6 py-4 dark:bg-gray-800">
						<RosterLogo id={roster.id} class="size-14" {href} />
						<div class="text-left">
							<div class="font-medium text-gray-300">Vinnare {bracket.name}</div>
							<a {href} class="-mt-1 block text-xl font-semibold hover:underline">{roster.name}</a>
						</div>

						<Icon icon="ph:crown-simple-fill" class="mr-2 ml-auto text-2xl" />
					</div>
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

			<Button
				icon="ph:discord-logo"
				label="Gå med i våran Discord"
				kind="secondary"
				class="mt-12"
				href={discordUrl}
			/>
		{:else if tournamentState.status === 'starting'}
			<h2 class="font-display text-4xl font-bold">{season.name} startar snart!</h2>
		{/if}
	</div>

	<div
		class="topo-bg absolute inset-0 -z-10 opacity-60 mix-blend-multiply saturate-0 dark:opacity-100"
	></div>
</section>

{#snippet countdown(endDate: Date)}
	{@const diff = new Date(endDate.getTime() - now)}

	<div class="mt-10 flex text-5xl font-bold sm:text-6xl md:text-7xl">
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

<style>
	.topo-bg {
		background-position: center;
		background-size: cover;
		background-image:
			radial-gradient(circle, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.3) 80%),
			url('$lib/assets/images/topo-bg.jpg');
	}
</style>
