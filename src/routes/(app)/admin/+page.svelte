<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { createSeason } from './page.remote.js';

	let { data } = $props();

	let seasons = $state(data.seasons);

	let createSeasonOpen = $state(false);

	let newSeasonName = $state('');
	let newSeasonStartedAt = $state(new Date());

	async function submitNewSeason() {
		const { season } = await createSeason({
			name: newSeasonName,
			startedAt: newSeasonStartedAt
		});

		await goto(`/admin/sasong/${season.id}`);
	}
</script>

<Breadcrumbs crumbs={[]} />

<AdminCard title="Säsonger">
	{#if seasons.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createSeasonOpen = true)}>
			Det finns inga säsonger!
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each seasons as { id, name } (id)}
				<AdminLink href="/admin/sasong/{id}">
					{name}
				</AdminLink>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (createSeasonOpen = true)} />
	{/if}
</AdminCard>

<Dialog title="Skapa säsong" bind:open={createSeasonOpen}>
	<input type="text" bind:value={newSeasonName} placeholder="Namn" />
	<button onclick={submitNewSeason}>Skapa</button>
</Dialog>

<CreateDialog
	title="Skapa säsong"
	bind:open={createSeasonOpen}
	oncreate={submitNewSeason}
	onclose={() => (newSeasonName = '')}
	disabled={!newSeasonName}
>
	<Label label="Namn">
		<InputField
			bind:value={newSeasonName}
			placeholder="T.ex. Säsong 1..."
			onenter={submitNewSeason}
		/>
	</Label>
</CreateDialog>
