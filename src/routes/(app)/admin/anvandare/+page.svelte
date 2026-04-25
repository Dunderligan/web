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
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';

	let { data } = $props();

	let users = $state(data.users);

	SaveContext.set(new SaveContext({ save }));

	const saveCtx = SaveContext.get();

	const currentUser = $derived(page.data.user);

	let search = $state('');
	const shownUsers = $derived(
		users.filter((user) => user.battletag.toLowerCase().includes(search.toLowerCase()))
	);

	async function save() {
		const otherUsers = users.filter((user) => user.id !== currentUser?.id);

		await updateUsers({ users: otherUsers });
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Användare', href: '/admin/anvandare' }]} />

<AdminCard title="Hantera användare">
	<Label label="Filtrera användare">
		<InputField bind:value={search} placeholder="Skriv battletag..." />
	</Label>

	<Table
		rows={shownUsers}
		key={(user) => user.id}
		class="grid-cols-[1fr_150px_200px]"
		columns={[
			{ label: 'Battletag' },
			{ label: 'Roll', center: true, note: roleNote },
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

{#snippet roleNote()}
	<ul class="list-inside list-disc text-left font-medium">
		<li class="mb-1">
			<b>Superadmin:</b> Högsta rollen, med exklusiv rätt att befordra andra till admin.
		</li>
		<li class="mb-1">
			<b>Admin:</b> Kan göra allt, inklusive se, ändra och ta bort all data, samt befordra användare
			till moderatorer.
		</li>
		<li>
			<b>Moderator:</b> Kan skapa matcher och ändra matchresultat, samt redigera spelarprofiler. Har
			heller inte tillgång till gömda säsonger.
		</li>
	</ul>
{/snippet}
