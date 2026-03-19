<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { createApiKey, deleteApiKey } from '$lib/remote/auth.remote';
	import { ConfirmContext } from '$lib/state/confirm.svelte.js';
	import { SaveContext } from '$lib/state/save.svelte';
	import { formatDate, formatDateTime } from '$lib/util';

	let { data } = $props();

	SaveContext.set(new SaveContext());

	const confirmCtx = ConfirmContext.get();

	let keys = $state(data.keys);

	let createOpen = $state(false);
	let newKeyName = $state('');

	let tokenDialogOpen = $state(false);
	let tokenValue = $state('');

	async function oncreate() {
		const { key, token } = await createApiKey({
			name: newKeyName
		});

		keys.push(key);

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
			negative: true,
			action: async () => {
				await deleteApiKey({ id });

				keys = keys.filter((key) => key.id !== id);
			}
		});
	}
</script>

<Breadcrumbs crumbs={[{ label: 'API-nycklar', href: '/admin/api-nycklar' }]} />

<AdminCard title="Hantera API-nycklar">
	{#snippet description()}
		API-nycklar används för att autentisera tredjepartstjänster som behöver utföra handlingar i ditt
		namn.
		<br />
		I nuläget ger API-nycklar tillgång till hela ditt konto, så dela bara ut dem till tjänster du litar
		på!
	{/snippet}

	{#if keys.length > 0}
		<Table
			rows={keys}
			key={(key) => key.id}
			class="grid-cols-[1fr_150px_150px_100px]"
			columns={[
				{ label: 'Namn' },
				{ label: 'Skapad', center: true },
				{ label: 'Användes senast', center: true },
				{ label: '' }
			]}
		>
			{#snippet row({ value: key })}
				<div class="flex items-center py-4 pl-6 text-lg font-semibold">
					{key.name}
				</div>

				<div class="flex items-center justify-center font-medium">
					{formatDate(key.createdAt)}
				</div>

				<div class="flex items-center justify-center font-medium">
					{key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Aldrig'}
				</div>

				<div class="flex items-center justify-center gap-2">
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
		class="rounded-md bg-gray-100 p-4 text-center font-mono text-xl text-gray-700 dark:bg-gray-800 dark:text-gray-300"
	>
		{tokenValue}
	</div>
</Dialog>
