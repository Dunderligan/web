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
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import { createGroup } from '$lib/remote/group.remote';
	import { deleteDivision, updateDivision } from '$lib/remote/division.remote';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import GenerateBracketDialog from '$lib/components/admin/GenerateBracketDialog.svelte';

	const { data } = $props();

	const division = $state(data.division);
	const season = $state(division.season);

	SaveContext.set(
		new SaveContext({
			save,
			href: `/stallningar/${season.slug}?div=${division.slug}&visa=gruppspel`
		})
	);

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	let createGroupOpen = $state(false);
	let newGroupName = $state('');

	let createBracketOpen = $state(false);

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera division',
			description: `Är du säker på att du vill radera ${division.name}, ${season.name}?`,
			negative: true,
			action: async () => {
				await deleteDivision({
					id: division.id
				});

				await goto(`/admin/sasong/${season.id}`);
			}
		});
	}

	async function submitNewGroup() {
		const { group } = await createGroup({
			name: newGroupName,
			divisionId: division.id
		});

		await goto(`/admin/grupp/${group.id}`);
	}

	async function save() {
		await updateDivision({
			id: division.id,
			name: division.name,
			playoffLine: division.playoffLine,
			groupwiseStandings: division.groupwiseStandings
		});
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` }
	]}
/>

<AdminCard title="Grupper">
	{#if division.groups.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createGroupOpen = true)}>
			Denna division har inga grupper.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each division.groups as { id, name } (id)}
				<AdminLink href="/admin/grupp/{id}">
					{name}
				</AdminLink>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (createGroupOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Slutspel">
	{#if division.brackets.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createBracketOpen = true)}>
			Denna division har inga brackets.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each division.brackets as { id, name } (id)}
				<AdminLink href="/admin/bracket/{id}">
					{name ?? 'Bracket'}
				</AdminLink>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (createBracketOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<div class="space-y-2">
		<Label label="Namn">
			<InputField bind:value={division.name} oninput={saveCtx.setDirty} />
		</Label>

		<Label label="Antal lag till slutspel">
			<InputField
				type="number"
				bind:value={division.playoffLine}
				oninput={saveCtx.setDirty}
				placeholder="Alla lag går till slutspel"
			/>
		</Label>

		<Label label="Tabell per grupp">
			<Checkbox bind:checked={division.groupwiseStandings} onCheckedChange={saveCtx.setDirty} />
		</Label>
	</div>

	<Button icon="ph:trash" label="Radera division" kind="negative" onclick={submitDelete} />
</AdminCard>

<CreateDialog
	title="Skapa grupp"
	bind:open={createGroupOpen}
	oncreate={submitNewGroup}
	onclose={() => {
		newGroupName = '';
	}}
	disabled={!newGroupName}
>
	<Label label="Namn">
		<InputField bind:value={newGroupName} placeholder="T.ex. Grupp A..." />
	</Label>
</CreateDialog>

<GenerateBracketDialog bind:open={createBracketOpen} divisionId={division.id} />

<SaveToast />
