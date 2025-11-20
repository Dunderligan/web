<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import { createSeason } from '$lib/remote/season.remote';

	let { data } = $props();

	SaveContext.set(new SaveContext());

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

	function resetNewSeason() {
		newSeasonName = '';
		newSeasonStartedAt = new Date();
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

<CreateDialog
	title="Skapa säsong"
	bind:open={createSeasonOpen}
	oncreate={submitNewSeason}
	onclose={resetNewSeason}
	disabled={!newSeasonName.trim()}
>
	<Label label="Namn">
		<InputField bind:value={newSeasonName} placeholder="T.ex. Säsong 1..." />
	</Label>

	<Label label="Startdatum">
		<DateInput bind:value={newSeasonStartedAt} type="date" required />
	</Label>
</CreateDialog>
