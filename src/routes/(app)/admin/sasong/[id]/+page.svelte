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
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte.js';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import { createDivision, deleteSeason } from './page.remote.js';

	const { data } = $props();

	const season = $state(data.season);

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

		<Button icon="ph:plus" onclick={() => (createDivisionOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Button icon="ph:trash" label="Radera säsong" kind="negative" onclick={submitDelete} />
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
