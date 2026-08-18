<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import { createDivision } from '$lib/remote/division.remote';
	import { createRegistration, deleteSeason, updateSeason } from '$lib/remote/season.remote';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Note from '$lib/components/ui/Note.svelte';
	import AdminLinkList from '$lib/components/admin/AdminLinkList.svelte';
	import { isAdmin } from '$lib/authRole.js';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';

	const { data } = $props();

	const season = $state(data.season);
	let registration = $state(season.registration);

	SaveContext.set(new SaveContext({ save, href: `/stallningar/${season.slug}` }));

	const confirmCtx = ConfirmContext.get();
	const saveCtx = SaveContext.get();

	let createDivisionOpen = $state(false);
	let newDivisionName = $state('');

	let createRegistrationOpen = $state(false);
	let newRegistrationStart = $state(new Date());
	let newRegistrationEnd = $state(new Date());

	async function submitNewDivision() {
		const { division } = await createDivision({
			name: newDivisionName,
			seasonId: season.id
		});

		await goto(`/admin/division/${division.id}`);
	}

	async function save() {
		await updateSeason({
			id: season.id,
			name: season.name,
			startedAt: season.startedAt,
			endedAt: season.endedAt,
			legacyRanks: season.legacyRanks,
			legacySeeding: season.legacySeeding,
			hidden: season.hidden,
			spinoff: season.spinoff,
			checkinOpen: season.checkinOpen
		});
	}

	async function onDeleteClicked() {
		await confirmCtx.confirm({
			title: 'Radera säsong',
			description: `Är du säker på att du vill radera ${season.name}?`,
			destructive: true,
			action: async () => {
				await deleteSeason({
					id: season.id
				});

				await goto('/admin');
			}
		});
	}

	async function submitCreateRegistation() {
		const { registration } = await createRegistration({
			seasonId: season.id,
			openDate: newRegistrationStart,
			closeDate: newRegistrationEnd
		});

		await goto(`/admin/registration/${registration.id}`);
	}
</script>

<Breadcrumbs crumbs={[{ label: season.name, href: `/admin/sasong/${season.id}` }]} />

<AdminCard title="Divisioner">
	<AdminLinkList
		items={season.divisions}
		linkHref={(division) => `/admin/division/${division.id}`}
		linkLabel={(division) => division.name}
		emptyText="Denna säsong har inga divisioner."
		oncreateclick={() => (createDivisionOpen = true)}
	/>
</AdminCard>

{#if isAdmin(data.user?.role)}
	<AdminCard title="Inchecking">
		<Label label="Incheckning öppen">
			<Checkbox bind:checked={season.checkinOpen} onCheckedChange={saveCtx.setDirty} />
		</Label>

		{#if season.checkinOpen}
			<AdminLink href="/admin/checkin/{season.id}" rounded>Visa överblick</AdminLink>
		{/if}
	</AdminCard>

	<AdminCard title="Anmälan">
		{#if registration}
			<div class="overflow-hidden rounded-lg">
				<AdminLink href="/admin/registration/{registration.id}">Hantera anmälan</AdminLink>
			</div>
		{:else}
			<AdminEmptyNotice oncreateclick={() => (createRegistrationOpen = true)}
				>Säsongen har inget anmälningsformulär.</AdminEmptyNotice
			>
		{/if}
	</AdminCard>

	<AdminCard title="Inställningar">
		<div class="space-y-2">
			<Label label="Namn">
				<InputField
					bind:value={season.name}
					placeholder="T.ex. Säsong 1..."
					oninput={saveCtx.setDirty}
					required
				/>
			</Label>

			<Label label="Startdatum">
				<DateInput bind:value={season.startedAt} type="date" oninput={saveCtx.setDirty} required />
			</Label>

			<Label label="Slutdatum">
				<DateInput bind:value={season.endedAt} type="date" oninput={saveCtx.setDirty} />
			</Label>

			<Label label="Gömd">
				<Note content="Gömda säsonger visas endast för administratörer." />
				<Checkbox bind:checked={season.hidden} onCheckedChange={saveCtx.setDirty} />
			</Label>

			<Label label="Spinoff">
				<Note
					content="Spinoff säsonger listas separat i säsongsarkivet och visas som standard inte på spelarsidor."
				/>
				<Checkbox bind:checked={season.spinoff} onCheckedChange={saveCtx.setDirty} />
			</Label>

			<Label label="Legacy seeding">
				<Note content="Använd seedingreglerna som de var innan ändringarna i säsong 8." />
				<Checkbox bind:checked={season.legacySeeding} onCheckedChange={saveCtx.setDirty} />
			</Label>

			<Label label="SR-poäng">
				<Checkbox bind:checked={season.legacyRanks} onCheckedChange={saveCtx.setDirty} />
			</Label>
		</div>

		<Button icon="ph:trash" label="Radera säsong" kind="destructive" onclick={onDeleteClicked} />
	</AdminCard>
{/if}

<CreateDialog
	title="Skapa division"
	bind:open={createDivisionOpen}
	oncreate={submitNewDivision}
	onclose={() => (newDivisionName = '')}
>
	<Label label="Namn">
		<InputField bind:value={newDivisionName} placeholder="T.ex. Division 1..." />
	</Label>
</CreateDialog>

<CreateDialog
	title="Skapa anmälningsformulär"
	bind:open={createRegistrationOpen}
	oncreate={submitCreateRegistation}
>
	<Label label="Startdatum">
		<DateInput bind:value={newRegistrationStart} type="datetime-local" required />
	</Label>

	<Label label="Slutdatum">
		<DateInput bind:value={newRegistrationEnd} type="datetime-local" required />
	</Label>
</CreateDialog>

<SaveToast />
