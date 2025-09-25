<script lang="ts">
	import { page } from '$app/state';
	import { authClient, isAdmin } from '$lib/auth-client';
	import Button from '$lib/components/Button.svelte';
	import Match from '$lib/components/Match.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageSection from '$lib/components/PageSection.svelte';
	import StandingsTable from '$lib/components/StandingsTable.svelte';
	import Tabs from '$lib/components/Tabs.svelte';
	import { buildBracket } from '$lib/util';

	const session = authClient.useSession();

	let { data } = $props();

	let { season, divisions } = $derived(data);

	const isOngoing = $derived(season.endedAt === null);

	let activeDivision = $derived.by(() => {
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
</script>

<PageHeader>
	<div class="font-display">
		<h1
			class="mb-3 text-center font-display text-6xl font-extrabold text-black sm:text-left sm:text-7xl"
		>
			{season.name}
		</h1>

		{#if isOngoing}
			<span
				class="mr-1 rounded-full border-green-600 bg-green-200 px-4 py-2 text-sm font-semibold text-green-800"
			>
				Pågående</span
			>
		{/if}

		<span class="font-medium text-gray-500"
			>• Startade {season.startedAt.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}</span
		>
	</div>
</PageHeader>

<PageSection>
	<section class="grow">
		<div class="mb-6 flex max-w-lg flex-col gap-1.5">
			<Tabs
				selected={activeDivision}
				items={divisions.map((division) => ({
					label: division.name,
					value: division,
					href: `?div=${division.slug}`
				}))}
			/>

			<Tabs
				hideSelectedIcon
				selected={mode}
				items={[
					{
						icon: 'mdi:table',
						label: 'Gruppspel',
						value: 'group',
						href: `?div=${activeDivision.slug}&visa=gruppspel`
					},
					{
						icon: 'mdi:bracket',
						label: 'Slutspel',
						value: 'bracket',
						href: `?div=${activeDivision.slug}&visa=slutspel`
					}
				]}
			/>
		</div>

		{#if mode === 'group'}
			<StandingsTable
				rosters={activeDivision.rosters}
				scores={activeDivision.table}
				seasonSlug={season.slug}
			/>
		{:else}
			{@const rounds = buildBracket(activeDivision.matches)}

			<div class="flex w-full items-stretch gap-4">
				{#each rounds as round}
					<div class="flex w-full flex-col justify-around gap-4">
						{#each round as match}
							<Match {match} />
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</section>
	<section class="shrink-0 sm:w-1/4">
		{#if isAdmin($session.data?.user)}
			<Button
				label="Redigera division"
				icon="mdi:edit"
				kind="secondary"
				class="max-w-max"
				href="/admin/division/{activeDivision.id}"
			/>
		{/if}
	</section>
</PageSection>
