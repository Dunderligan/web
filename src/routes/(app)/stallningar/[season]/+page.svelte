<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import StandingsTable from '$lib/components/table/StandingsTable.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { seasonState, formatDate } from '$lib/util';
	import Bracket from '$lib/components/match/Bracket.svelte';
	import { buildBracketRounds } from '$lib/bracket';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import type { UnresolvedMatch, ResolvedMatch, Roster } from '$lib/types';
	import SeasonStateChip from '$lib/components/ui/SeasonStateChip.svelte';
	import MatchList from '$lib/components/match/MatchList.svelte';
	import { goto } from '$app/navigation';
	import Meta from '$lib/components/structure/Meta.svelte';

	let { data } = $props();

	let { season, divisions } = $derived(data);

	const state = $derived(seasonState(season));

	let division = $derived.by(() => {
		const param = page.url.searchParams.get('div');

		return param ? (divisions.find((div) => div.slug === param) ?? divisions[0]) : divisions[0];
	});

	const hasGroupStage = $derived(division.rosters.length > 0);
	const hasPlayoffs = $derived(division.brackets.length > 0);

	const tabItems = $derived([
		{
			icon: 'ph:table',
			label: 'Gruppspel',
			value: 'group',
			href: `?div=${division.slug}&visa=gruppspel`,
			disabled: !hasGroupStage
		},
		{
			icon: 'ph:trophy',
			label: 'Slutspel',
			value: 'bracket',
			href: `?div=${division.slug}&visa=slutspel`,
			disabled: !hasPlayoffs
		}
	]);

	$effect(() => {
		// prevent invalid modes
		if (!hasGroupStage && !hasPlayoffs) {
			return;
		}

		if (mode === 'group' && !hasGroupStage) {
			goto(`?div=${division.slug}&visa=slutspel`, { replaceState: true });
		} else if (mode === 'bracket' && !hasPlayoffs) {
			goto(`?div=${division.slug}&visa=gruppspel`, { replaceState: true });
		}
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

	function resolveRoster(id?: string | null): Roster | null {
		return division.rosters.find((roster) => roster.id === id) ?? null;
	}

	function resolveMatch(match: UnresolvedMatch): ResolvedMatch {
		return {
			rosterA: resolveRoster(match.rosterAId),
			rosterB: resolveRoster(match.rosterBId),
			...match
		};
	}
</script>

<Meta
	title="{displayMode} - {division.name} - {season.name}"
	description="Se tabellen och resultaten för {division.name} i {season.name} av Dunderligan."
/>

<PageHeader>
	<h1 class="mb-3 text-center text-6xl font-extrabold sm:text-left sm:text-7xl">
		{season.name}
	</h1>

	<div
		class="flex flex-row flex-wrap items-center justify-center gap-3 text-center sm:flex-row sm:items-center sm:justify-start"
	>
		<SeasonStateChip {state} />

		<div class="font-medium text-gray-600 dark:text-gray-400">
			{#if state === 'upcoming'}
				Startar {formatDateWithoutYear(season.startedAt)}
				{season.startedAt.getFullYear()}
			{:else if state === 'ongoing'}
				<span>Inleddes {formatDateWithoutYear(season.startedAt)}</span>
				{#if season.endedAt}
					<span>och avslutas {formatDateWithoutYear(season.endedAt)}</span>
				{/if}
			{:else if season.startedAt.getDate() === season.endedAt!.getDate()}
				Pågick under {formatDate(season.startedAt)}
			{:else}
				Pågick mellan {formatDateWithoutYear(season.startedAt)}
				{#if season.endedAt!.getFullYear() !== season.startedAt!.getFullYear()}
					{season.startedAt.getFullYear()}
				{/if}
				och {formatDateWithoutYear(season.endedAt!)}
				{season.endedAt!.getFullYear()}
			{/if}
		</div>
	</div>
</PageHeader>

<PageSection>
	<section class="grow overflow-hidden">
		<div class="mb-4 flex max-w-lg flex-col gap-1.5">
			<Tabs
				selected={division.id}
				items={divisions.map((division) => ({
					label: division.name,
					value: division.id,
					href: `?div=${division.slug}&visa=${mode === 'group' ? 'gruppspel' : 'slutspel'}`
				}))}
			/>

			<Tabs fillIcons selected={mode} items={tabItems} />
		</div>

		{#if mode === 'group'}
			{#each division.tables as table}
				{@const resolvedStandings = table.standings.map(({ rosterId, score }) => ({
					roster: resolveRoster(rosterId)!,
					score
				}))}

				{#if table.type === 'grupp'}
					<Subheading class="mt-6 mb-4 flex justify-between">
						<span>{table.title}</span>
					</Subheading>
				{/if}

				<StandingsTable
					standings={resolvedStandings}
					playoffLine={division.playoffLine}
					seasonSlug={season.slug}
				/>

				{#if page.data.user?.isAdmin}
					<Button
						label="Redigera"
						icon="ph:pencil-simple"
						kind="secondary"
						class="mt-4 max-w-max"
						href="/admin/{table.type}/{table.id}"
					/>
				{/if}
			{/each}

			<MatchList
				title="Kommande matcher"
				matches={division.upcomingMatches.map(resolveMatch)}
				seasonSlug={season.slug}
				hideIfEmpty
			/>

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

				<MatchList matches={division.latestMatches.map(resolveMatch)} seasonSlug={season.slug} />
			{/if}
		{:else}
			{#each division.brackets as bracket (bracket.id)}
				{#if division.brackets.length > 1 || bracket.name !== division.name}
					<Subheading class="mt-6 mb-4">{bracket.name}</Subheading>
				{/if}

				<Bracket
					seasonSlug={season.slug}
					rounds={buildBracketRounds(bracket.matches.map(resolveMatch))}
				/>

				{#if page.data.user?.isAdmin}
					<Button
						label="Redigera"
						icon="ph:pencil-simple"
						kind="secondary"
						class="mt-4 max-w-max"
						href="/admin/bracket/{bracket.id}"
					/>
				{/if}
			{/each}
		{/if}
	</section>
</PageSection>
