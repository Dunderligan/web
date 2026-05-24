<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { isModerator } from '$lib/authRole';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import PlayerSelect from '$lib/components/admin/PlayerSelect.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import {
		createPlayerAward,
		deleteAwardType,
		deletePlayerAward,
		updateAwardType,
		updatePlayerAward
	} from '$lib/remote/award.remote';
	import type { PlayerAward } from '$lib/types.js';
	import TextArea from '$lib/components/ui/TextArea.svelte';

	let { data } = $props();

	let awardType = $state(data.awardType);
	let awards = $state(data.awardType.awards);

	$effect(() => {
		awardType = data.awardType;
		awards = data.awardType.awards;
	});

	SaveContext.set(new SaveContext({ save }));

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	let createOpen = $state(false);

	let selectedPlayerId = $state<string | undefined>();
	let selectedSeasonId = $state<string | undefined>();
	let selectedDivisionId = $state<string | undefined>();

	let editAward = $state<PlayerAward | null>(null);
	let editOpen = $state(false);
	let newDescription = $state('');

	async function save() {
		const result = await updateAwardType({
			id: awardType.id,
			name: awardType.name,
			showDivision: awardType.showDivision
		});

		awardType = { ...awardType, ...result.awardType };
	}

	async function submitDeleteAwardType() {
		await confirmCtx.confirm({
			title: 'Radera utmärkelse',
			description: `Är du säker på att du vill radera ${awardType.name} och alla tilldelningar av den?`,
			negative: true,
			action: async () => {
				await deleteAwardType({ id: awardType.id });
				await goto('/admin/utmarkelser');
			}
		});
	}

	async function createAward() {
		if (!selectedPlayerId) return;

		await createPlayerAward({
			awardTypeId: awardType.id,
			playerId: selectedPlayerId,
			divisionId: selectedDivisionId ?? null
		});

		await invalidate('admin:awards');

		createOpen = false;
		resetCreateDialog();
	}

	async function updateAward() {
		if (!editAward) return;

		await updatePlayerAward({
			id: editAward.id,
			description: newDescription.length > 0 ? newDescription : null
		});

		await invalidate('admin:awards');

		editOpen = false;
		editAward = null;
	}

	async function deleteAward(id: string) {
		await confirmCtx.confirm({
			title: 'Radera utmärkelse',
			description: 'Är du säker på att du vill radera den här utmärkelsen?',
			negative: true,
			action: async () => {
				await deletePlayerAward({ id });
				await invalidate('admin:awards');
			}
		});
	}

	function resetCreateDialog() {
		selectedPlayerId = undefined;
		selectedSeasonId = undefined;
		selectedDivisionId = undefined;
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: 'Utmärkelser', href: '/admin/utmarkelser' },
		{ label: awardType.name, href: `/admin/utmarkelser/${awardType.id}` }
	]}
/>

<AdminCard title="Vinnare">
	{#if awards.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createOpen = true)}>
			Denna utmärkelse har inga vinnare än.
		</AdminEmptyNotice>
	{:else}
		<Table
			rows={awards}
			key={(award) => award.id}
			class="grid-cols-[1fr_1fr_1fr_100px]"
			columns={[
				{ label: 'Battletag' },
				{ label: awardType.showDivision ? 'Säsong' : '', center: true },
				{ label: awardType.showDivision ? 'Division' : '', center: true },
				{ label: '' }
			]}
		>
			{#snippet row({ value: award })}
				<div class="py-4 pl-6 font-semibold">
					<a href="/admin/spelare/{award.player.id}" class="hover:underline"
						>{award.player.battletag}</a
					>
				</div>

				<div class="justify-center text-center text-base">
					<a href="/admin/sasong/{award.division?.season.id}" class="hover:underline"
						>{award.division?.season.name}</a
					>
				</div>

				<div class="justify-center text-center text-base">
					<a href="/admin/division/{award.division?.id}" class="hover:underline"
						>{award.division?.name}</a
					>
				</div>

				<div class="justify-center gap-2 px-2">
					<Button
						icon="ph:pencil-simple"
						kind="tertiary"
						onclick={() => {
							editAward = award;
							newDescription = award.description ?? '';
							editOpen = true;
						}}
					/>
					<Button icon="ph:trash" kind="tertiary" onclick={() => deleteAward(award.id)} />
				</div>
			{/snippet}
		</Table>

		<Button icon="ph:plus" onclick={() => (createOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<div class="space-y-2">
		<Label label="Namn">
			<InputField bind:value={awardType.name} oninput={saveCtx.setDirty} />
		</Label>

		<Label label="Har division">
			<Checkbox bind:checked={awardType.showDivision} onCheckedChange={saveCtx.setDirty} />
		</Label>
	</div>

	<Button
		icon="ph:trash"
		label="Radera utmärkelse"
		kind="negative"
		onclick={submitDeleteAwardType}
	/>
</AdminCard>

<CreateDialog
	title="Tilldela utmärkelse"
	bind:open={createOpen}
	oncreate={createAward}
	disabled={!selectedPlayerId || (awardType.showDivision && !selectedDivisionId)}
	onclose={resetCreateDialog}
>
	<Label label="Spelare">
		<PlayerSelect bind:value={selectedPlayerId} />
	</Label>

	{#if awardType.showDivision}
		<Label label="Säsong">
			<Select
				type="single"
				bind:value={selectedSeasonId}
				placeholder="Välj säsong..."
				class="grow"
				items={data.seasons.map((season) => ({
					label: season.name,
					value: season.id
				}))}
			/>
		</Label>

		<Label label="Division">
			<Select
				type="single"
				bind:value={selectedDivisionId}
				placeholder="Välj division..."
				class="grow"
				items={data.seasons
					.find((season) => season.id === selectedSeasonId)
					?.divisions.map((division) => ({
						label: division.name,
						value: division.id
					})) ?? []}
				disabled={!selectedSeasonId}
			/>
		</Label>
	{/if}
</CreateDialog>

<CreateDialog
	title="Redigera utmärkelse"
	bind:open={editOpen}
	oncreate={updateAward}
	createLabel="Spara"
>
	{#if editAward}
		<Label label="Beskrivning" column>
			<TextArea
				bind:value={newDescription}
				class="w-full"
				placeholder="En motivering av varför denna spelare har tilldelats utmärkelsen..."
			/>
		</Label>
	{/if}
</CreateDialog>

<SaveToast />
