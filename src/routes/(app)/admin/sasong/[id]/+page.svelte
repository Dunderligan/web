<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import CreateDialog from '$lib/components/CreateDialog.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Label from '$lib/components/Label.svelte';
	import SaveToast from '$lib/components/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte.js';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import { createDivision, deleteSeason, editSeason } from './page.remote.js';

	const { data } = $props();

	const season = $state(data.season);

	SaveContext.set(new SaveContext(save));

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	let createDivisionOpen = $state(false);
	let newDivisionName = $state('');

	async function submitNewDivision() {
		const { division } = await createDivision({
			name: newDivisionName,
			seasonId: season.id
		});

		await goto(`/admin/division/${division.id}`);
	}

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera säsong',
			description: `Är du säker på att du vill radera ${season.name}?`,
			negative: true,
			action: async () => {
				await deleteSeason({
					id: season.id
				});

				await goto('/admin');
			}
		});
	}

	async function save() {
		await editSeason({
			id: season.id,
			name: season.name
		});
	}
</script>

<Breadcrumbs crumbs={[{ label: season.name, href: `/admin/sasong/${season.id}` }]} />

<AdminCard title="Divisioner">
	{#if season.divisions.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createDivisionOpen = true)}>
			Denna säsong har inga divisioner.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each season.divisions as { id, name } (id)}
				<AdminLink href="/admin/division/{id}">
					{name}
				</AdminLink>
			{/each}
		</div>

		<Button icon="mdi:plus" onclick={() => (createDivisionOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={season.name} oninput={saveCtx.setDirty} />
	</Label>

	<Button icon="mdi:trash-can" label="Radera säsong" kind="negative" onclick={submitDelete} />
</AdminCard>

<CreateDialog
	title="Skapa division"
	bind:open={createDivisionOpen}
	oncreate={submitNewDivision}
	onclose={() => (newDivisionName = '')}
>
	<Label label="Namn">
		<InputField
			bind:value={newDivisionName}
			placeholder="T.ex. Division 1..."
			onenter={submitNewDivision}
		/>
	</Label>
</CreateDialog>

<SaveToast />
