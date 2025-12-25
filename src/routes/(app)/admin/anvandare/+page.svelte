<script lang="ts">
	import { page } from '$app/state';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { updateUsers } from '$lib/remote/auth.remote.js';
	import { SaveContext } from '$lib/state/save.svelte';
	import { formatDate } from '$lib/util.js';

	let { data } = $props();

	let users = $state(data.users);

	SaveContext.set(new SaveContext({ save }));

	const saveCtx = SaveContext.get();

	async function save() {
		await updateUsers({ users });
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Användare', href: '/admin/anvandare' }]} />

<AdminCard title="Hantera användare">
	<Table
		rows={users}
		key={(user) => user.id}
		columns={[
			{ label: 'Battletag' },
			{ label: 'Admin', center: true },
			{ label: 'Första inloggning', center: true }
		]}
		class="grid-cols-[1fr_100px_200px]"
	>
		{#snippet row({ value: user })}
			<div class="flex items-center py-4 pl-6 text-lg font-semibold">
				{user.battletag}
			</div>

			<div class="flex items-center justify-center">
				{#if user.isSuperAdmin}
					<Icon icon="ph:shield-check" class="text-blue-600" title="Superadmin" />
				{:else}
					<Checkbox
						bind:checked={user.isAdmin}
						onCheckedChange={saveCtx.setDirty}
						disabled={!page.data.user?.isSuperAdmin}
					/>
				{/if}
			</div>

			<div class="flex items-center justify-center font-medium">
				{formatDate(user.createdAt)}
			</div>
		{/snippet}
	</Table>
</AdminCard>

<SaveToast />
