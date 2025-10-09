<script lang="ts">
	import { page } from '$app/state';
	import { authClient, isAdmin } from '$lib/auth-client';
	import BracketMatch from '$lib/components/BracketMatch.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
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

	function formatDateWithoutYear(date: Date) {
		return date.toLocaleDateString(undefined, {
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<PageHeader>
	<h1
		class="mb-3 text-center font-display text-6xl font-extrabold text-black sm:text-left sm:text-7xl"
	>
		{season.name}
	</h1>

	<div class="flex items-center justify-center gap-1 sm:justify-start">
		<div
			class={[
				isOngoing
					? 'bg-green-200 font-semibold text-green-800'
					: 'bg-gray-300 font-medium text-gray-700',
				'mr-1 flex max-w-max items-center gap-1 rounded-full py-1 pr-3 pl-2 text-sm'
			]}
		>
			<Icon icon={isOngoing ? 'mdi:circle-outline' : 'mdi:pause'} class="text-xl" />

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
				selected={activeDivision.id}
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
						icon: 'mdi:table',
						label: 'Gruppspel',
						value: 'group',
						href: `?div=${activeDivision.slug}&visa=gruppspel`
					},
					{
						icon: 'mdi:bracket',
						label: 'Slutspel',
						value: 'bracket',
						href: `?div=${activeDivision.slug}&visa=slutspel`,
						disabled: activeDivision.matches.length === 0
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

			<div class="w-full overflow-x-auto rounded-lg p-1">
				<div class="flex min-w-3xl items-stretch gap-4">
					{#each rounds as round}
						<div class="flex flex-col justify-around gap-8" style="width: {100 / rounds.length}%;">
							{#each round as match}
								{@const rosterA = activeDivision.rosters.find(
									(roster) => roster.id === match.rosterAId
								)}
								{@const rosterB = activeDivision.rosters.find(
									(roster) => roster.id === match.rosterBId
								)}

								<BracketMatch
									seasonSlug={season.slug}
									match={{
										rosterA,
										rosterB,
										...match
									}}
								/>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if isAdmin($session.data?.user)}
			<Button
				label="Redigera division"
				icon="mdi:edit"
				kind="secondary"
				class="mt-4 max-w-max"
				href="/admin/division/{activeDivision.id}"
			/>
		{/if}
	</section>
</PageSection>
