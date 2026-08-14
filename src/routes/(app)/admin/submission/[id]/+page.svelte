<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import SubmissionChip from '$lib/components/admin/SubmissionChip.svelte';
	import EditableMembersTable from '$lib/components/table/EditableMembersTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import { Role } from '$lib/types.js';

	const { data } = $props();

	const submission = $state(data.submission);
	const registration = $derived(submission.registration);
	const season = $derived(registration.season);

	SaveContext.set(new SaveContext({ save }));

	const confirmCtx = ConfirmContext.get();
	const saveCtx = SaveContext.get();

	async function onDeleteClicked() {
		// await confirmCtx.confirm({
		// 	title: 'Radera anmälningsformulär',
		// 	description: `Är du säker på att du vill radera anmälan för ${season.name}?`,
		// 	destructive: true,
		// 	action: async () => {
		// 		await deleteRegistration({
		// 			id: registration.id
		// 		});
		// 		await goto(`/admin/sasong/${season.id}`);
		// 	}
		// });
	}

	async function save() {
		// await updateRegistration({
		// 	id: registration.id,
		// 	openDate: registration.openDate,
		// 	closeDate: registration.closeDate
		// });
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: 'Anmälan', href: `/admin/registration/${registration.id}` },
		{ label: submission.name, href: `/admin/submission/${submission.id}` }
	]}
/>

<AdminCard title="Spelartrupp">
	<EditableMembersTable
		bind:members={submission.data.members}
		legacyRanks={season.legacyRanks}
		forceFullBattletag
		forceRanks
		minPlayers={6}
		maxPlayers={9}
		minTeamCaptains={1}
		maxPlayersByRole={{ [Role.MANAGER]: 1, [Role.COACH]: 2 }}
	/>
</AdminCard>

<AdminCard title="Inställningar">
	<div class="space-y-2">
		<Label label="Lagnamn">
			<InputField bind:value={submission.data.name} oninput={saveCtx.setDirty} />
		</Label>

		<Label label="Status">
			<SubmissionChip status={submission.status} />
		</Label>
	</div>

	<div class="flex gap-2">
		<Button icon="ph:check-circle" label="Godkänn" kind="primary" />
		<Button icon="ph:x-circle" label="Neka" kind="secondary" />
	</div>

	<Button icon="ph:trash" label="Radera anmälan" kind="destructive" onclick={onDeleteClicked} />
</AdminCard>

<SaveToast />
