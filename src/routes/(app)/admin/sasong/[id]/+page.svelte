<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
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

<Breadcrumbs crumbs={[{ label: season.name, href: `admin/sasong/${season.id}` }]} />

<AdminCard title="Divisioner">
	<div class="space-y-1 overflow-hidden rounded-lg">
		{#each season.divisions as { id, name } (id)}
			<AdminLink href="/admin/division/{id}">
				{name}
			</AdminLink>
		{/each}
	</div>
</AdminCard>

<div class="rounded-xl bg-gray-100 p-6">
	<h2 class="text-xl font-bold">Inställningar</h2>

	<input class="block" type="text" bind:value={name} />

	<button onclick={submitDelete}>Radera säsong</button>
</div>

<Dialog title="Skapa division" bind:open={createDialogOpen}>
	<input type="text" bind:value={newDivisionName} />
	<button onclick={submitDivision}>Skapa</button>
</Dialog>
