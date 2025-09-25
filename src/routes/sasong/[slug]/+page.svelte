<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient, isAdmin } from '$lib/auth-client';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageSection from '$lib/components/PageSection.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import Table from '$lib/components/Table.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	const session = authClient.useSession();

	let { data } = $props();

	let { season, divisions } = $derived(data);

	const isOngoing = $derived(season.endedAt === null);

	let activeDivision = $derived.by(() => {
		const param = page.url.searchParams.get('div');

		return param ? (divisions.find((div) => div.slug === param) ?? divisions[0]) : divisions[0];
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
		<div class="flex max-w-lg flex-col gap-1.5">
			<Tabs
				items={divisions.map((division) => ({
					label: division.name,
					value: division,
					href: `?div=${division.slug}`
				}))}
				selected={activeDivision}
			/>

			<Tabs
				hideSelectedIcon
				items={[
					{
						icon: 'mdi:table',
						label: 'Gruppspel',
						value: 'group'
					},
					{
						icon: 'mdi:bracket',
						label: 'Slutspel',
						value: 'bracket'
					}
				]}
			/>
		</div>

		<Table
			columns={[
				'#',
				{
					label: 'Lag',
					center: false
				},
				'Poäng',
				'W/L/D',
				'Matcher'
			]}
			rows={activeDivision.table}
			key={(row) => row.rosterId}
			class="mt-6 grid-cols-[50px_1fr_80px_60px_80px]"
		>
			{#snippet row({ index, value: { rosterId, score } })}
				{@const { id, name, slug } = activeDivision.rosters.find(
					(roster) => roster.id === rosterId
				)!}

				<div class="flex items-center justify-center bg-gray-200 text-lg font-semibold">
					{index + 1}
				</div>

				<div class="flex min-w-0 items-center gap-2 bg-gray-200 py-2 text-lg font-semibold">
					<RosterLogo {id} />

					<a href="/lag/{season.slug}/{slug}" class="truncate hover:text-accent-600 hover:underline"
						>{name}</a
					>
				</div>

				<div class="flex items-center justify-center bg-gray-200 text-lg font-semibold">
					{score.mapWins}
				</div>

				<div class="flex items-center justify-center bg-gray-200 text-lg font-medium">
					{score.mapWins}/{score.mapLosses}/{score.mapDraws}
				</div>

				<div class="flex items-center justify-center bg-gray-200 text-lg font-medium">
					{score.matchesPlayed}
				</div>
			{/snippet}
		</Table>

		<!--

		{#if table}
			<table class="w-5xl">
				<thead>
					<tr>
						<th>#</th>
						<th>Lag</th>
						<th>Poäng</th>
						<th>W/L/D</th>
						<th>Matcher</th>
					</tr>
				</thead>
				<tbody>
					{#each table as { rosterId, score }, i (rosterId)}
						{@const roster = rosters.find((roster) => roster.id === rosterId)!}

						<tr>
							<td>{i + 1}</td>
							<td><a class="underline" href="/lag/{season.slug}/{roster.slug}">{roster.name}</a></td
							>
							<td>{score.mapWins}</td>
							<td>{score.mapWins}/{score.mapLosses}/{score.mapDraws}</td>
							<td>{score.matchesPlayed}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		{#if isAdmin($session.data?.user)}
			<div>
				<a href="/admin/grupp/{activeGroup?.id}">Redigera</a>
			</div>
		{/if} -->
	</section>
	<section class="shrink-0 sm:w-1/4"></section>
</PageSection>
