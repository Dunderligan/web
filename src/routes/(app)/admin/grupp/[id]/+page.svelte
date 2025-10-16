<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import CreateDialog from '$lib/components/CreateDialog.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Label from '$lib/components/Label.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import SaveToast from '$lib/components/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte.js';
	import { SaveContext } from '$lib/state/save.svelte';
	import { createAndAddRoster, deleteGroup, editGroup } from './page.remote';

	const { data } = $props();

	const group = $state(data.group);
	const { season, division } = $derived(data);

	RosterContext.set(new RosterContext(data.group.rosters));
	SaveContext.set(new SaveContext(save));

	let confirmCtx = ConfirmContext.get();
	let saveCtx = SaveContext.get();

	let addRosterOpen = $state(false);
	let addRosterMode: 'new' | 'existing' = $state('new');
	let newRosterName = $state('');

	async function save() {
		await editGroup({
			id: group.id,
			name: group.name
		});
	}

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera grupp',
			description: `Är du säker på att du vill radera ${group.name} i ${season.name}, ${division.name} <b>tillsammans med ${group.rosters.length} rosters</b>?`,
			negative: true,
			action: async () => {
				await deleteGroup({
					id: group.id
				});

				await goto(`/admin/division/${division.id}`);
			}
		});
	}

	async function submitNewRoster() {
		const { roster } = await createAndAddRoster({
			groupId: group.id,
			seasonSlug: season.slug,
			name: newRosterName
		});

		await goto(`/admin/roster/${roster.id}`);
	}
</script>

<EditMatchDialog />

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: group.name, href: `/admin/grupp/${group.id}` }
	]}
/>

<AdminCard title="Lag">
	{#if group.rosters.length === 0}
		<AdminEmptyNotice bind:createDialogOpen={addRosterOpen}>
			Denna grupp har inga lag.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each group.rosters as { id, name } (id)}
				<AdminLink href="/admin/roster/{id}">
					<RosterLogo {id} class="mr-2 inline size-12" />
					{name}</AdminLink
				>
			{/each}
		</div>

		<Button icon="mdi:add" class="mt-2" onclick={() => (addRosterOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={group.name} oninput={saveCtx.setDirty} />
	</Label>

	<Button icon="mdi:trash-can" label="Radera grupp" kind="negative" onclick={submitDelete} />
</AdminCard>

<CreateDialog
	title="Skapa roster"
	bind:open={addRosterOpen}
	oncreate={submitNewRoster}
	onclose={() => {
		addRosterMode = 'new';
		newRosterName = '';
	}}
>
	<Label label="Namn">
		<InputField
			bind:value={newRosterName}
			placeholder="T.ex. Groot Gaming..."
			onenter={submitNewRoster}
		/>
	</Label>
</CreateDialog>

<SaveToast />
