<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import SubmissionChip from '$lib/components/admin/SubmissionChip.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { deleteRegistration, updateRegistration } from '$lib/remote/registration.remote.js';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import type { ChipColor } from '$lib/types.js';
	import { formatDate } from '$lib/util.js';

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
			closeDate: registration.closeDate
		});
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: 'Anmälan', href: `/admin/registration/${registration.id}` }
	]}
/>

<AdminCard title="Laganmälningar">
	{#if registration.submissions.length > 0}
		<Table
			rows={registration.submissions}
			columns={[
				{ label: 'Lagnamn' },
				{ label: 'Status', center: true },
				{ label: 'Skapad', center: true },
				{ label: 'Redigerad', center: true },
				{ label: 'Granskad', center: true },
				{ label: '' }
			]}
			class="grid-cols-[auto_1fr_1fr_1fr_1fr_auto]"
			noBackground
		>
			{#snippet row({ value: submission })}
				<div class="px-6 py-4 font-semibold">
					{submission.name}
				</div>

				<div class="justify-center">
					<SubmissionChip status={submission.status} />
				</div>

				{#each [submission.createdAt, submission.editedAt, submission.reviewedAt] as date}
					<div class="justify-center">
						{date ? formatDate(date) : '-'}
					</div>
				{/each}

				<div>
					<Button
						icon="ph:arrow-right"
						label="Hantera"
						kind="secondary"
						href="/admin/submission/{submission.id}"
					/>
				</div>
			{/snippet}
		</Table>
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
	</div>

	<Button icon="ph:trash" label="Radera anmälan" kind="destructive" onclick={onDeleteClicked} />
</AdminCard>

<SaveToast />
