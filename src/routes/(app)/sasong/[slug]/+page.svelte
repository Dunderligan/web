<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import StandingsTable from '$lib/components/table/StandingsTable.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { buildBracket } from '$lib/util';
	import Bracket from '$lib/components/match/Bracket.svelte';

	// const session = authClient.useSession();

	let { data } = $props();

	let { season, divisions } = $derived(data);

	const isOngoing = $derived(season.endedAt === null);

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
</script>

<svelte:head>
	<title>{displayMode} - {division.name} - {season.name} | Dunderligan</title>
	<meta
		name="description"
		content="{displayMode} för {division.name} i {season.name} av Dunderligan, sveriges främsta Overwatchliga.
			Säsongen inleddes {season.startedAt}{season.endedAt
			? ` och avslutades ${season.endedAt}`
			: ' och pågår fortfarande'}.
			I divisionen tävlar {division.rosters.map((roster) => roster.name).join(', ')}."
	/>

	<meta
		property="og:description"
		content="{displayMode}, {division.name} i {season.name} av Dunderligan."
	/>
</svelte:head>

<PageHeader>
	<h1 class="mb-3 text-center text-6xl font-extrabold text-black sm:text-left sm:text-7xl">
		{season.name}
	</h1>

	<div class="flex items-center justify-center gap-1 sm:justify-start">
		<div
			class={[
				isOngoing
					? 'bg-green-200 font-semibold text-green-800'
					: 'bg-gray-200 font-medium text-gray-600',
				'mr-1 flex max-w-max items-center gap-1 rounded-full px-4 py-1.5 text-sm'
			]}
		>
			<Icon icon={isOngoing ? 'ph:circle' : 'ph:stop'} class="text-xl" />

			{isOngoing ? 'Pågående' : 'Avslutad'}
		</div>

		<div class="font-medium text-gray-500">
			•

			{#if isOngoing}
				Startade {formatDateWithoutYear(season.startedAt)}
			{:else}
				Pågick mellan {formatDateWithoutYear(season.startedAt)} och {formatDateWithoutYear(
					season.endedAt ?? new Date()
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
					href: `?div=${division.slug}`
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
			<StandingsTable rosters={division.rosters} scores={division.table} seasonSlug={season.slug} />
		{:else}
			<Bracket
				seasonSlug={season.slug}
				rounds={buildBracket(
					division.matches.map((match) => {
						// resolve match rosters
						const rosterA = division.rosters.find((roster) => roster.id === match.rosterAId);
						const rosterB = division.rosters.find((roster) => roster.id === match.rosterBId);

						return {
							rosterA,
							rosterB,
							...match
						};
					})
				)}
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
