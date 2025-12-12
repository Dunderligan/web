<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import StandingsTable from '$lib/components/table/StandingsTable.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { seasonState } from '$lib/util';
	import Bracket from '$lib/components/match/Bracket.svelte';
	import { buildBracketRounds } from '$lib/bracket.js';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import Match from '$lib/components/match/Match.svelte';
	import type { FullMatch, FullMatchWithoutOrder, ResolvedMatch } from '$lib/types.js';

	// const session = authClient.useSession();

	let { data } = $props();

	let { season, divisions } = $derived(data);

	const state = $derived(seasonState(season));

	let division = $derived.by(() => {
		const param = page.url.searchParams.get('div');

		return param ? (divisions.find((div) => div.slug === param) ?? divisions[0]) : divisions[0];
	});

	type Mode = 'group' | 'bracket';

	let mode: Mode = $derived.by(() => {
		const param = page.url.searchParams.get('visa');

		switch (param) {
			case 'gruppspel':
				return 'group';
			case 'slutspel':
				return 'bracket';
			default:
				return 'group';
		}
	});

	const displayMode = $derived.by(() => {
		switch (mode) {
			case 'group':
				return 'Gruppspel';
			case 'bracket':
				return 'Slutspel';
		}
	});

	function formatDateWithoutYear(date: Date) {
		return date.toLocaleDateString('sv-SE', {
			month: 'long',
			day: 'numeric'
		});
	}

	function resolveMatch(match: FullMatchWithoutOrder): ResolvedMatch {
		// resolve match rosters
		const rosterA = division.rosters.find((roster) => roster.id === match.rosterAId);
		const rosterB = division.rosters.find((roster) => roster.id === match.rosterBId);

		return {
			rosterA,
			rosterB,
			...match
		};
	}
</script>

<svelte:head>
	<title>{displayMode} - {division.name} - {season.name} | Dunderligan</title>
	<meta
		name="description"
		content="Se tabellen och resultaten för {division.name} i {season.name} av Dunderligan."
	/>

	<meta
		property="og:description"
		content="Se tabellen och resultaten för {division.name} i {season.name} av Dunderligan."
	/>
</svelte:head>

<PageHeader>
	<h1 class="mb-3 text-center text-6xl font-extrabold sm:text-left sm:text-7xl">
		{season.name}
	</h1>

	<div class="flex items-center justify-center gap-1 sm:justify-start">
		<div
			class={[
				{
					upcoming: 'bg-yellow-200 font-semibold text-yellow-800',
					ongoing: 'bg-green-200 font-semibold text-green-800',
					ended: 'bg-gray-200 font-medium text-gray-600'
				}[state],
				'flex max-w-max items-center gap-1 rounded-full px-4 py-1.5 text-sm'
			]}
		>
			<Icon
				class="mr-1 text-lg"
				icon={{
					upcoming: 'ph:calendar-blank',
					ongoing: 'ph:circle',
					ended: 'ph:check'
				}[state]}
			/>

			{{
				upcoming: 'Kommande',
				ongoing: 'Pågående',
				ended: 'Avslutad'
			}[state]}
		</div>

		<div class="font-medium text-gray-500">
			<span class="mx-2">•</span>

			{#if state === 'upcoming'}
				Startar {formatDateWithoutYear(season.startedAt)}
				{season.startedAt.getFullYear()}
			{:else if state === 'ongoing'}
				<span>Inleddes {formatDateWithoutYear(season.startedAt)}</span>
				{#if season.endedAt}
					<span>och avslutas {formatDateWithoutYear(season.endedAt)}</span>
				{/if}
			{:else}
				Pågick mellan {formatDateWithoutYear(season.startedAt)} och {formatDateWithoutYear(
					season.endedAt!
				)}
				{season.startedAt.getFullYear()}
			{/if}
		</div>
	</div>
</PageHeader>

<PageSection>
	<section class="grow overflow-hidden">
		<div class="mb-6 flex max-w-lg flex-col gap-1.5">
			<Tabs
				selected={division.id}
				items={divisions.map((division) => ({
					label: division.name,
					value: division.id,
					href: `?div=${division.slug}&visa=${mode === 'group' ? 'grupp' : 'slutspel'}`
				}))}
			/>

			<Tabs
				hideSelectedIcon
				selected={mode}
				items={[
					{
						icon: 'ph:table',
						label: 'Gruppspel',
						value: 'group',
						href: `?div=${division.slug}&visa=gruppspel`
					},
					{
						icon: 'iconoir:tournament',
						label: 'Slutspel',
						value: 'bracket',
						href: `?div=${division.slug}&visa=slutspel`,
						disabled: division.matches.length === 0
					}
				]}
			/>
		</div>

		{#if mode === 'group'}
			<StandingsTable {division} seasonSlug={season.slug} />

			{#if division.latestMatches.length > 0}
				<div class="mt-10 mb-4 flex max-w-2xl items-center justify-between">
					<Subheading>Senaste matcherna</Subheading>

					<Button
						href="/arkiv/matcher?division={division.id}&spelad=true&prev={page.url.pathname}"
						label="Se alla"
						icon="ph:arrow-right"
						kind="secondary"
					/>
				</div>

				<div class="max-w-2xl space-y-2">
					{#each division.latestMatches as match (match.id)}
						<Match seasonSlug={season.slug} match={resolveMatch(match)} />
					{/each}
				</div>
			{/if}

			{#if division.upcomingMatches.length > 0}
				<Subheading class="mt-10 mb-4">Kommande matcher</Subheading>

				<div class="max-w-2xl space-y-2">
					{#each division.upcomingMatches as match (match.id)}
						<Match seasonSlug={season.slug} match={resolveMatch(match)} />
					{/each}
				</div>
			{/if}
		{:else}
			<Bracket
				seasonSlug={season.slug}
				rounds={buildBracketRounds(division.matches.map(resolveMatch))}
			/>
		{/if}

		{#if page.data.user?.isAdmin}
			<Button
				label="Redigera division"
				icon="ph:pencil-simple"
				kind="secondary"
				class="mt-4 max-w-max"
				href="/admin/division/{division.id}"
			/>
		{/if}
	</section>
</PageSection>
