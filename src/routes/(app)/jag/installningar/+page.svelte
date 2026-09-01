<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { formatRole } from '$lib/auth-role.js';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import InputField from '$lib/components/form/InputField.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import { deleteAccount } from '$lib/remote/account.remote';
	import { createApiKey, deleteApiKey } from '$lib/remote/auth.remote.js';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { formatDate, formatDateTime } from '$lib/util';
	import SubmissionsTable from '$lib/components/table/SubmissionsTable.svelte';
	import Select from '$lib/components/form/Select.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';

	let { data } = $props();

	ConfirmContext.set(new ConfirmContext());

	const confirmCtx = ConfirmContext.get();

	const user = $derived(page.data.user);

	async function onDeleteClicked() {
		await confirmCtx.confirm({
			title: 'Radera konto',
			description: 'Är du säker på att du vill radera ditt konto? Detta går inte att ångra!',
			destructive: true,
			action: async () => {
				await deleteAccount();
				await goto('/');
				await invalidateAll();
			}
		});
	}

	let apiKeys = $state(data.apiKeys);

	let createOpen = $state(false);
	let newKeyName = $state('');

	let tokenDialogOpen = $state(false);
	let tokenValue = $state('');

	async function oncreate() {
		const { key, token } = await createApiKey({
			name: newKeyName
		});

		apiKeys.push(key);

		tokenValue = token;
		tokenDialogOpen = true;

		createOpen = false;
		newKeyName = '';
	}

	async function ondelete(id: string) {
		await confirmCtx.confirm({
			title: 'Radera API-nyckel',
			description:
				'Är du säker på att du vill radera den här API-nyckeln? Alla applikationer som använder den kommer att sluta fungera. Den här åtgärden går inte att ångra.',
			destructive: true,
			action: async () => {
				await deleteApiKey({ id });

				apiKeys = apiKeys.filter((key) => key.id !== id);
			}
		});
	}
</script>

<Meta title="Inställningar" description="Hantera dina kontoinställningar." />

<PageSection class="space-y-8">
	{#if user}
		<AdminCard title="Kontoinformation">
			<div class="space-y-2">
				<Label label="Battletag">
					<InputField value={user.battletag} readonly />
				</Label>

				<Label label="Roll">
					<InputField value={formatRole(user.role)} readonly />
				</Label>

				<Label label="Första inloggning">
					<InputField value={formatDate(user.createdAt)} readonly />
				</Label>
			</div>
		</AdminCard>
	{/if}

	{#if data.submissions.length > 0}
		<AdminCard title="Laganmälningar">
			<SubmissionsTable submissions={data.submissions} />
		</AdminCard>
	{/if}

	<AdminCard title="API-nycklar">
		{#snippet description()}
			API-nycklar används för att autentisera tredjepartstjänster som behöver utföra handlingar i
			ditt namn.
			<br />
			I nuläget ger API-nycklar tillgång till hela ditt konto, så dela bara ut dem till tjänster du litar
			på!
		{/snippet}

		{#if apiKeys.length > 0}
			<Table
				rows={apiKeys}
				key={(key) => key.id}
				columns={[
					{ label: 'Namn', width: '1fr' },
					{ label: 'Skapad', center: true },
					{ label: 'Användes senast', center: true },
					{}
				]}
			>
				{#snippet row({ value: key })}
					<div class="text-lg font-semibold">
						{key.name}
					</div>

					<div class="justify-center">
						{formatDate(key.createdAt)}
					</div>

					<div class="justify-center">
						{key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Aldrig'}
					</div>

					<div class="justify-center">
						<Button icon="ph:trash" kind="tertiary" onclick={() => ondelete(key.id)} />
					</div>
				{/snippet}
			</Table>

			<Button icon="ph:plus" onclick={() => (createOpen = true)} />
		{:else}
			<AdminEmptyNotice oncreateclick={() => (createOpen = true)}
				>Du har inga API-nycklar än.</AdminEmptyNotice
			>
		{/if}
	</AdminCard>

	<AdminCard title="Åtgärder">
		<Button icon="ph:trash" label="Radera konto" kind="destructive" onclick={onDeleteClicked} />
	</AdminCard>
</PageSection>

<CreateDialog
	title="Skapa API-nyckel"
	{oncreate}
	bind:open={createOpen}
	disabled={!newKeyName.trim()}
>
	<Label label="Namn">
		<InputField bind:value={newKeyName} placeholder="Ange ett unikt namn..." />
	</Label>
</CreateDialog>

<Dialog
	bind:open={tokenDialogOpen}
	title="API-nyckel skapad"
	description="Din API-nyckel har skapats! Spara undan den på en säker plats; du kommer inte att kunna se
		den igen."
	buttons={[
		{
			label: 'Stäng',
			onclick: () => (tokenDialogOpen = false),
			kind: 'secondary',
			icon: 'ph:x-circle'
		}
	]}
>
	<div
		class="rounded-md bg-gray-100 p-4 text-center font-mono text-lg text-gray-700 dark:bg-gray-800 dark:text-gray-300"
	>
		{tokenValue}
	</div>
</Dialog>

<ConfirmDialog />
