<script lang="ts">
	import { goto } from '$app/navigation';
	import Dialog from '$lib/components/Dialog.svelte';
	import { createDivision, deleteSeason } from './page.remote.js';

	const { data } = $props();

	const season = $state(data.season);

	let createDialogOpen = $state(false);
	let newDivisionName = $state('');

	let name = $state(season.name);

	async function submitDivision() {
		const { division } = await createDivision({
			name: newDivisionName,
			seasonId: season.id
		});

		season.divisions.push(division);
		createDialogOpen = false;
		newDivisionName = '';

		//await goto(`/admin/division/${division.id}`);
	}

	async function submitDelete() {
		await deleteSeason({
			id: season.id
		});

		await goto('/admin');
	}
</script>

<div class="space-y-6">
	<h1 class="text-4xl font-bold">{season.name}</h1>

	<div class="rounded-xl bg-gray-100 p-6">
		<h2 class="text-xl font-bold">Divisioner</h2>

		<button onclick={() => (createDialogOpen = true)}>Skapa division</button>

		<table class="w-full">
			<thead>
				<tr>
					<th> Namn </th>
					<th> </th>
				</tr>
			</thead>
			<tbody>
				{#each season.divisions as { id, name }, i (id)}
					<tr>
						<td>
							<a href="/admin/division/{id}">{name}</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="rounded-xl bg-gray-100 p-6">
		<h2 class="text-xl font-bold">Inställningar</h2>

		<input class="block" type="text" bind:value={name} />

		<button onclick={submitDelete}>Radera säsong</button>
	</div>
</div>

<Dialog title="Skapa division" bind:open={createDialogOpen}>
	<input type="text" bind:value={newDivisionName} />
	<button onclick={submitDivision}>Skapa</button>
</Dialog>
