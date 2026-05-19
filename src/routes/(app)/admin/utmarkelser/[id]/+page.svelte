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

	let { data } = $props();

	let awardType = $state(data.awardType);
	let awards = $state(data.awards);

	$effect(() => {
		awardType = data.awardType;
		awards = data.awards;
	});

	const divisions = $derived(
		data.divisions.toSorted((a, b) => {
			const dateDiff = b.season.startedAt.getTime() - a.season.startedAt.getTime();
			return dateDiff || a.name.localeCompare(b.name);
		})
	);

	const divisionItems = $derived(
		divisions.map((division) => ({
			value: division.id,
			label: `${division.season.name} – ${division.name}`
		}))
	);

	const canEdit = $derived(isModerator(data.user?.role));

	SaveContext.set(new SaveContext({ save, href: `/admin/utmarkelser/${awardType.id}` }));

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	let createOpen = $state(false);
	let selectedPlayer = $state<{ id: string; battletag: string } | null>(null);
	let selectedPlayerId = $state<string | undefined>();
	let selectedDivisionId = $state<string | undefined>();

	let editOpen = $state(false);
	let editAward = $state<(typeof data.awards)[number] | null>(null);
	let editPlayerId = $state<string | undefined>();
	let editSelectedPlayer = $state<{ id: string; battletag: string } | null>(null);
	let editDivisionId = $state<string | undefined>();

	async function save() {
		const result = await updateAwardType({
			id: awardType.id,
			name: awardType.name,
			showDivision: awardType.showDivision
		});

		awardType = result.awardType;
	}

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera utmärkelse',
			description: `Är du säker på att du vill radera ${awardType.name}? Alla kopplade utmärkelser tas bort.`,
			negative: true,
			action: async () => {
				await deleteAwardType({ id: awardType.id });
				await goto('/admin/utmarkelser');
			}
		});
	}

	async function submitCreateAward() {
		if (!selectedPlayerId) return;

		await createPlayerAward({
			awardTypeId: awardType.id,
			playerId: selectedPlayerId,
			divisionId: selectedDivisionId ?? null
		});

		await invalidate('admin:award-type');

		createOpen = false;
		selectedPlayer = null;
		selectedPlayerId = undefined;
		selectedDivisionId = undefined;
	}

	function openEditAward(award: (typeof data.awards)[number]) {
		editAward = award;
		editPlayerId = award.player.id;
		editSelectedPlayer = award.player;
		editDivisionId = award.division?.id;
		editOpen = true;
	}

	async function submitEditAward() {
		if (!editAward || !editPlayerId) return;

		await updatePlayerAward({
			id: editAward.id,
			playerId: editPlayerId,
			divisionId: editDivisionId ?? null
		});

		await invalidate('admin:award-type');

		editOpen = false;
		editAward = null;
		editPlayerId = undefined;
		editSelectedPlayer = null;
		editDivisionId = undefined;
	}

	async function submitDeleteAward(id: string) {
		await confirmCtx.confirm({
			title: 'Radera utmärkelse',
			description: 'Är du säker på att du vill radera den här utmärkelsen?',
			negative: true,
			action: async () => {
				await deletePlayerAward({ id });
				await invalidate('admin:award-type');
			}
		});
	}

	function formatSeason(award: (typeof data.awards)[number]) {
		return award.division?.season.name ?? '—';
	}

	function formatDivision(award: (typeof data.awards)[number]) {
		return award.division?.name ?? '—';
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: 'Utmärkelser', href: '/admin/utmarkelser' },
		{ label: awardType.name, href: `/admin/utmarkelser/${awardType.id}` }
	]}
/>

<AdminCard title="Utmärkelser">
	{#if awards.length === 0}
		<AdminEmptyNotice
			oncreateclick={() => (createOpen = true)}
			hideCreateButton={!canEdit}
		>
			Denna utmärkelse har inga vinnare än.
		</AdminEmptyNotice>
	{:else}
		<Table
			rows={awards}
			key={(award) => award.id}
			class="grid-cols-[1fr_1fr_1fr_120px]"
			columns={[
				{ label: 'Spelare' },
				{ label: 'Säsong', center: true },
				{ label: 'Division', center: true },
				{ label: '' }
			]}
		>
			{#snippet row({ value: award })}
				<div class="py-3 pl-6 font-semibold">
					{award.player.battletag}
				</div>

				<div class="justify-center text-center">
					{formatSeason(award)}
				</div>

				<div class="justify-center text-center">
					{formatDivision(award)}
				</div>

				<div class="justify-center gap-2">
					<Button
						icon="ph:pencil-simple"
						kind="tertiary"
						onclick={() => openEditAward(award)}
						disabled={!canEdit}
					/>
					<Button
						icon="ph:trash"
						kind="tertiary"
						onclick={() => submitDeleteAward(award.id)}
						disabled={!canEdit}
					/>
				</div>
			{/snippet}
		</Table>

		{#if canEdit}
			<Button icon="ph:plus" onclick={() => (createOpen = true)} />
		{/if}
	{/if}
</AdminCard>

{#if canEdit}
	<AdminCard title="Inställningar">
		<div class="space-y-2">
			<Label label="Namn">
				<InputField bind:value={awardType.name} oninput={saveCtx.setDirty} />
			</Label>

			<Label label="Visa division">
				<Checkbox bind:checked={awardType.showDivision} onCheckedChange={saveCtx.setDirty} />
			</Label>
		</div>

		<Button icon="ph:trash" label="Radera utmärkelse" kind="negative" onclick={submitDelete} />
	</AdminCard>
{/if}

<CreateDialog
	title="Lägg till utmärkelse"
	bind:open={createOpen}
	oncreate={submitCreateAward}
	disabled={!selectedPlayerId}
	onclose={() => {
		selectedPlayer = null;
		selectedPlayerId = undefined;
		selectedDivisionId = undefined;
	}}
>
	<Label label="Spelare">
		<PlayerSelect
			bind:value={selectedPlayerId}
			onValueChange={(player) => (selectedPlayer = player)}
		/>
	</Label>

	{#if selectedPlayer}
		<div class="text-sm text-gray-600 dark:text-gray-400">
			Vald spelare: {selectedPlayer.battletag}
		</div>
	{/if}

	<Label label="Division">
		<Select
			type="single"
			bind:value={selectedDivisionId}
			items={divisionItems}
			canClear
			placeholder="Ingen division"
		/>
	</Label>
</CreateDialog>

<CreateDialog
	title="Redigera utmärkelse"
	bind:open={editOpen}
	oncreate={submitEditAward}
	disabled={!editPlayerId}
	onclose={() => {
		editOpen = false;
		editAward = null;
		editPlayerId = undefined;
		editSelectedPlayer = null;
		editDivisionId = undefined;
	}}
>
	{#if editAward}
		<Label label="Spelare">
			<PlayerSelect
				bind:value={editPlayerId}
				onValueChange={(player) => (editSelectedPlayer = player)}
			/>
		</Label>

		{#if editSelectedPlayer}
			<div class="text-sm text-gray-600 dark:text-gray-400">
				Vald spelare: {editSelectedPlayer.battletag}
			</div>
		{/if}

		<Label label="Division">
			<Select
				type="single"
				bind:value={editDivisionId}
				items={divisionItems}
				canClear
				placeholder="Ingen division"
			/>
		</Label>
	{/if}
</CreateDialog>

<SaveToast />
