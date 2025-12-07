<script lang="ts">
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
		columns={[{ label: 'Battletag', center: false }, 'Admin', 'Första inloggning']}
		class="grid-cols-[1fr_100px_200px]"
	>
		{#snippet row({ value: user })}
			<div class="flex items-center bg-gray-100 py-4 pl-6 text-lg font-semibold">
				{user.battletag}
			</div>

			<div class="flex items-center justify-center bg-gray-100">
				{#if user.isSuperAdmin}
					<Icon icon="ph:shield-check" class="text-blue-600" title="Superadmin" />
				{:else}
					<Checkbox bind:checked={user.isAdmin} onCheckedChange={saveCtx.setDirty} />
				{/if}
			</div>

			<div class="flex items-center justify-center bg-gray-100 text-lg font-medium text-gray-700">
				{formatDate(user.createdAt)}
			</div>
		{/snippet}
	</Table>
</AdminCard>

<SaveToast />
