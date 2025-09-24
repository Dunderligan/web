<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient, isAdmin } from '$lib/auth-client';
	import Icon from '$lib/components/Icon.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageSection from '$lib/components/PageSection.svelte';

	const session = authClient.useSession();

	let { data } = $props();

	let season = $derived(data.season);

	const isActive = $derived(season.endedAt === null);

	let divisions = $derived(season.divisions);
	let activeDivision = $derived.by(() => {
		const param = page.url.searchParams.get('div');

		return param ? (divisions.find((div) => div.slug === param) ?? divisions[0]) : divisions[0];
	});

	let groups = $derived(activeDivision ? activeDivision.groups : []);
	let activeGroup = $derived.by(() => {
		const param = page.url.searchParams.get('grupp');

		return param ? (groups.find((group) => group.slug == param) ?? groups[0]) : groups[0];
	});
	let rosters = $derived(activeGroup?.rosters ?? []);

	let table = $derived(activeGroup ? (data.tables.get(activeGroup.id) ?? null) : null);
</script>

<PageHeader>
	<div class="font-display">
		<h1
			class="mb-3 text-center font-display text-6xl font-extrabold text-black sm:text-left sm:text-7xl"
		>
			{season.name}
		</h1>

		{#if isActive}
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
	<div>
		<h1 class="text-4xl font-bold">{data.season.name}</h1>

		<div class="flex items-center gap-2">
			<div class="font-semibold">Division</div>

			{#each divisions as division (division.id)}
				<button onclick={() => goto(`?div=${division.slug}`)}>
					{division.name}
					{activeDivision?.id === division.id ? '✓' : ''}
				</button>
			{/each}
		</div>

		{#if groups.length > 1}
			<div class="flex items-center gap-2">
				<div class="font-semibold">Grupp</div>

				{#each groups as group (group.id)}
					<button onclick={() => goto(`?div=${activeDivision?.slug}&grupp=${group.slug}`)}>
						{group.name}
						{activeGroup?.id === group.id ? '✓' : ''}
					</button>
				{/each}
			</div>
		{/if}

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
		{/if}
	</div>
</PageSection>
