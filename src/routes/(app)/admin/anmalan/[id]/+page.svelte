<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import SubmissionsTable from '$lib/components/admin/SubmissionsTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { deleteRegistration, updateRegistration } from '$lib/remote/registration.remote.js';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte.js';

	const { data } = $props();

	const registration = $state(data.registration);
	const season = $derived(registration.season);

	SaveContext.set(new SaveContext({ save }));

	const confirmCtx = ConfirmContext.get();
	const saveCtx = SaveContext.get();

	async function onDeleteClicked() {
		await confirmCtx.confirm({
			title: 'Radera anmälningsformulär',
			description: `Är du säker på att du vill radera anmälan för ${season.name}?`,
			destructive: true,
			action: async () => {
				await deleteRegistration({
					id: registration.id
				});

				await goto(`/admin/sasong/${season.id}`);
			}
		});
	}

	async function save() {
		await updateRegistration({
			id: registration.id,
			openDate: registration.openDate,
			closeDate: registration.closeDate,
			minPlayers: registration.minPlayers,
			maxPlayers: registration.maxPlayers
		});
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: 'Anmälan', href: `/admin/anmalan/${registration.id}` }
	]}
/>

<AdminCard title="Laganmälningar">
	{#if registration.submissions.length > 0}
		<SubmissionsTable submissions={registration.submissions} />
	{:else}
		<AdminEmptyNotice hideCreateButton>
			Inga lag har anmält sig än. När lag skickar in sina anmälningar kommer de att visas här.
		</AdminEmptyNotice>
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<div class="space-y-2">
		<Label label="Startdatum">
			<DateInput
				bind:value={registration.openDate}
				type="datetime-local"
				oninput={saveCtx.setDirty}
				required
			/>
		</Label>

		<Label label="Slutdatum">
			<DateInput
				bind:value={registration.closeDate}
				type="datetime-local"
				oninput={saveCtx.setDirty}
			/>
		</Label>

		<Label label="Min antal spelare">
			<InputField
				type="number"
				bind:value={registration.minPlayers}
				oninput={saveCtx.setDirty}
				required
			/>
		</Label>

		<Label label="Max antal spelare">
			<InputField
				type="number"
				bind:value={registration.maxPlayers}
				oninput={saveCtx.setDirty}
				required
			/>
		</Label>
	</div>

	<Button icon="ph:trash" label="Radera anmälan" kind="destructive" onclick={onDeleteClicked} />
</AdminCard>

<SaveToast />
