<script lang="ts">
	import Dialog from '$lib/components/Dialog.svelte';
	import { createSeason } from './page.remote.js';

	let { data } = $props();

	let seasons = $state(data.seasons);

	let createDialogOpen = $state(false);

	let newSeasonName = $state('');
	let newSeasonStartedAt = $state(new Date());

	async function submitNewSeason() {
		const { season } = await createSeason({
			name: newSeasonName,
			startedAt: newSeasonStartedAt
		});

		seasons.push(season);

		newSeasonName = '';
		createDialogOpen = false;
	}
</script>

<div class="space-y-6">
	<h1 class="text-4xl font-bold">Admin</h1>

	<h1 class="text-2xl font-semibold">Säsonger</h1>

	<table class="w-full">
		<thead>
			<tr>
				<th> Namn </th>
				<th> Inleddes </th>
				<th> Avslutades </th>
			</tr>
		</thead>
		<tbody>
			{#each seasons as season (season.id)}
				<tr>
					<td>
						<a href="/admin/sasong/{season.id}">{season.name}</a>
					</td>
					<td>
						{season.startedAt.toLocaleDateString()}
					</td>
					<td>
						{season.endedAt?.toLocaleDateString() ?? 'N/A'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<button onclick={() => (createDialogOpen = true)}>Skapa säsong</button>
</div>

<Dialog title="Skapa säsong" bind:open={createDialogOpen}>
	<input type="text" bind:value={newSeasonName} placeholder="Namn" />
	<button onclick={submitNewSeason}>Skapa</button>
</Dialog>
