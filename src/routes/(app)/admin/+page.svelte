<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import CreateDialog from '$lib/components/CreateDialog.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Label from '$lib/components/Label.svelte';
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
		<AdminEmptyNotice oncreateclick={() => (createSeasonOpen = true)}></AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each seasons as { id, name } (id)}
				<AdminLink href="/admin/sasong/{id}">
					{name}
				</AdminLink>
			{/each}
		</div>

		<Button icon="mdi:plus" onclick={() => (createSeasonOpen = true)} />
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
