<script lang="ts">
	import { AuthRole, canPromoteTo, formatRole as formatAuthRole } from '$lib/authRole';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { updateUsers } from '$lib/remote/auth.remote';
	import { SaveContext } from '$lib/state/save.svelte';
	import { formatDate } from '$lib/util';
	import { page } from '$app/state';

	let { data } = $props();

	let users = $state(data.users);

	SaveContext.set(new SaveContext({ save }));

	const saveCtx = SaveContext.get();

	const currentUser = $derived(page.data.user);

	async function save() {
		const otherUsers = users.filter((user) => user.id !== currentUser?.id);

		await updateUsers({ users: otherUsers });
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Användare', href: '/admin/anvandare' }]} />

<AdminCard title="Hantera användare">
	<Table
		rows={users}
		key={(user) => user.id}
		class="grid-cols-[1fr_150px_200px]"
		columns={[
			{ label: 'Battletag' },
			{ label: 'Roll', center: true },
			{ label: 'Första inloggning', center: true }
		]}
	>
		{#snippet row({ value: user })}
			<div class="flex items-center py-4 pl-6 text-lg font-semibold">
				{user.battletag}
			</div>

			<div class="flex items-center justify-center">
				<Select
					type="single"
					class="grow"
					bind:value={user.role}
					onValueChange={saveCtx.setDirty}
					items={Object.values(AuthRole).map((role) => ({
						label: formatAuthRole(role),
						disabled: !canPromoteTo(currentUser?.role, role),
						value: role
					}))}
					disabled={!canPromoteTo(currentUser?.role, user.role)}
				/>
			</div>

			<div class="flex items-center justify-center font-medium">
				{formatDate(user.createdAt)}
			</div>
		{/snippet}
	</Table>
</AdminCard>

<SaveToast />
