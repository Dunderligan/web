<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { isAdmin } from '$lib/authRole';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import SubmissionChip from '$lib/components/admin/SubmissionChip.svelte';
	import GroupSelect from '$lib/components/form/GroupSelect.svelte';
	import EditableMembersTable from '$lib/components/table/EditableMembersTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import {
		deleteTeamSubmission,
		editTeamSubmission,
		reviewTeamSubmission
	} from '$lib/remote/registration.remote.js';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import { Role, SubmissionStatus } from '$lib/types.js';
	import { formatDateTime } from '$lib/util';

	const { data } = $props();

	let submission = $state(data.submission);
	const registration = $derived(submission.registration);
	const season = $derived(registration.season);

	ConfirmContext.set(new ConfirmContext());
	SaveContext.set(new SaveContext({ save: onSaveClicked }));

	const confirmCtx = ConfirmContext.get();
	const saveCtx = SaveContext.get();

	const userIsAdmin = $derived(isAdmin(page.data.user?.role));
	const registrationOpen = $derived(Date.now() < registration.closeDate.getTime());
	const canEdit = $derived(userIsAdmin || registrationOpen);

	let approveGroupId: string | undefined = $state();
	let approveDialogOpen = $state(false);

	let loading = $state(false);

	async function onDeleteClicked() {
		await confirmCtx.confirm({
			title: 'Radera anmälan',
			description: submission.approvedRosterId
				? 'Är du säker på att du vill radera denna anmälan? Laget har redan blivit godkänt och tilldelats en plats i säsongen, så detta kommer även att radera laget.'
				: 'Är du säker på att du vill radera denna anmälan? Detta går inte att ångra.',
			destructive: true,
			action: async () => {
				await deleteTeamSubmission({
					id: submission.id
				});
				if (userIsAdmin) {
					await goto(`/admin/registration/${registration.id}`);
				} else {
					await goto(`/jag/mina-anmalningar`);
				}
			}
		});
	}

	async function onSaveClicked() {
		if (userIsAdmin) {
			await save();
			return;
		}

		confirmCtx.confirm({
			title: 'Spara ändringar',
			description:
				'Är du säker på att du vill spara dina ändringar? Ändringarna kommer att skickas in för granskning och laget kan behöva granskas på nytt.',
			action: async () => {
				await save();
			}
		});
	}

	async function save() {
		await editTeamSubmission({
			id: submission.id,
			data: submission.data
		});

		await refresh();
	}

	async function onApproveClicked() {
		if (submission.approvedRosterId) {
			await approve();
		} else {
			approveDialogOpen = true;
		}
	}

	async function approve() {
		try {
			loading = true;

			let groupId: string | undefined;
			if (!submission.approvedRosterId) {
				// A groupId is only required if we're approving this submission for the first time
				if (!approveGroupId) return;
				groupId = approveGroupId;
			}

			await reviewTeamSubmission({
				submissionId: submission.id,
				approve: true,
				groupId
			});
			await refresh();
		} finally {
			loading = false;
			approveDialogOpen = false;
		}
	}

	async function reject() {
		try {
			loading = true;
			await reviewTeamSubmission({
				submissionId: submission.id,
				approve: false
			});
			await refresh();
		} finally {
			loading = false;
		}
	}

	async function refresh() {
		await invalidate('admin:submission');
		submission = data.submission;
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: 'Anmälan', href: `/admin/registration/${registration.id}` },
		{ label: submission.name, href: `/admin/submission/${submission.id}` }
	]}
/>

{#if !canEdit}
	<Notice kind="warn">Anmälan kan inte redigeras eftersom anmälningsperioden är avslutad.</Notice>
{/if}

<AdminCard title="Granskning">
	<div class="space-y-2">
		<Label label="Status">
			<SubmissionChip status={submission.status} />
		</Label>

		<Label label="Granskades senast">
			{#if submission.reviewedAt && submission.reviewedBy}
				<span class="font-medium"
					>{formatDateTime(submission.reviewedAt)} av {submission.reviewedBy.battletag}
				</span>
			{:else}
				-
			{/if}
		</Label>
	</div>

	{#if userIsAdmin}
		{#if submission.status === SubmissionStatus.PENDING}
			{#if submission.approvedRosterId}
				<Notice kind="info">
					Det här laget har tidigare blivit godkänt och tilldelats en plats i säsongen, men sedan
					dess har laget blivit uppdaterat och behöver granskas på nytt.
				</Notice>
			{/if}

			<div class="flex gap-2">
				<Button
					icon="ph:check-circle"
					label="Godkänn"
					kind="primary"
					onclick={onApproveClicked}
					{loading}
				/>
				<Button icon="ph:x-circle" label="Neka" kind="destructive" onclick={reject} {loading} />
			</div>
		{:else if submission.status === SubmissionStatus.APPROVED}
			<Notice kind="info">
				Det här laget har blivit godkänt och tilldelats en plats i säsongen. {#if registrationOpen}
					Ägaren av laget kan fortfarande redigera anmälan och skicka in den på nytt för granskning.
				{/if}
			</Notice>
		{:else if submission.status === SubmissionStatus.REJECTED}
			{#if submission.approvedRosterId}
				<Notice kind="info">
					Det här laget har tidigare blivit godkänt och tilldelats en plats i säsongen, men sedan
					dess har blivit uppdaterad och nekats på nytt.
				</Notice>
			{/if}

			{#if registrationOpen}
				<Notice kind="info">
					Ägaren av laget kan fortfarande redigera anmälan och skicka in den på nytt för granskning.
				</Notice>
			{/if}
		{/if}
	{:else if submission.status === SubmissionStatus.APPROVED && registrationOpen}
		<Notice kind="info">
			Din nuvarande anmälan har blivit godkänd och tilldelats en plats i säsongen. Du kan
			fortfarande redigera din anmälan och skicka in den på nytt för granskning, men laget kommer då
			att behöva granskas på nytt.
		</Notice>
	{:else if submission.approvedRosterId}
		{#if submission.status === SubmissionStatus.PENDING}
			<Notice kind="info">
				Laget har tilldelats en plats i säsongen, men anmälan har sedan dess uppdaterats och behöver
				granskas på nytt.
			</Notice>
		{:else if submission.status === SubmissionStatus.REJECTED}
			<Notice kind="info">
				Laget har tidigare blivit godkänt och tilldelats en plats i säsongen, men anmälan har sen
				dess upddaterats och nekats på nytt.
			</Notice>
		{/if}
	{:else if submission.status === SubmissionStatus.REJECTED && registrationOpen}
		<Notice kind="info">
			Din nuvarande anmälan har blivit nekad, men du har fortfarande möjlighet att redigera din
			anmälan och skicka in den på nytt för granskning.
		</Notice>
	{/if}
</AdminCard>

<AdminCard title="Spelartrupp">
	<EditableMembersTable
		bind:members={submission.data.members}
		legacyRanks={season.legacyRanks}
		forceFullBattletag
		forceRanks
		minPlayers={registration.minPlayers}
		maxPlayers={registration.maxPlayers}
		minTeamCaptains={1}
		maxPlayersByRole={{ [Role.MANAGER]: 1, [Role.COACH]: 2 }}
		disabled={!canEdit}
	/>
</AdminCard>

<AdminCard title="Inställningar">
	<div class="space-y-2">
		<Label label="Lagnamn">
			<InputField
				bind:value={submission.data.name}
				oninput={saveCtx.setDirty}
				disabled={!canEdit}
			/>
		</Label>
	</div>

	<Button icon="ph:trash" label="Radera anmälan" kind="destructive" onclick={onDeleteClicked} />
</AdminCard>

<CreateDialog
	bind:open={approveDialogOpen}
	title="Godkänn anmälan"
	oncreate={approve}
	createLabel="Godkänn"
	createIcon="ph:check-circle"
	disabled={!approveGroupId}
>
	{#snippet description()}
		<p>
			Detta lag har inte blivit godkänt än och behöver därför tilldelas en division och grupp innan
			laget kan få en plats i säsongen. Detta går att ändra senare i lagets inställningar.
		</p>

		<p>
			Ägaren av laget kommer, tills anmälningsperioden är avslutad, kunna redigera anmälan och
			skicka in den på nytt för granskning.
		</p>
	{/snippet}

	<Label label="Grupp">
		<GroupSelect seasonId={season.id} bind:groupId={approveGroupId} />
	</Label>
</CreateDialog>

<ConfirmDialog />
<SaveToast />
