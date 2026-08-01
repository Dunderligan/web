<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { formatRole } from '$lib/authRole';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { deleteAccount } from '$lib/remote/account.remote';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { formatDate } from '$lib/util';

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
</script>

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

	<AdminCard title="Inställningar">
		<Button icon="ph:trash" label="Radera konto" kind="destructive" onclick={onDeleteClicked} />
	</AdminCard>
</PageSection>

<ConfirmDialog />
