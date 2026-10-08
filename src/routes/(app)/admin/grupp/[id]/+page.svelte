<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EditableMatch from '$lib/components/match/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/match/EditMatchDialog.svelte';
	import InputField from '$lib/components/form/InputField.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import CreateRosterDialog from '$lib/components/admin/CreateRosterDialog.svelte';
	import { deleteGroup, updateGroup } from '$lib/remote/group.remote';
	import { createRoster } from '$lib/remote/roster.remote';
	import { createGroupMatch, isInMatch } from '$lib/match.js';
	import RosterSelect from '$lib/components/admin/RosterSelect.svelte';
	import { isAdmin } from '$lib/auth-role.js';
	import AdminRosterList from '$lib/components/admin/AdminRosterList.svelte';

	const { data } = $props();

	const division = $derived(data.group.division);
	const season = $derived(division.season);

	RosterContext.set(new RosterContext(data.group.rosters));
	SaveContext.set(
		new SaveContext({
			save,
			href: `/stallningar/${season.slug}?div=${division.slug}&visa=gruppspel`
		})
	);

	let rosterCtx = RosterContext.get();
	let confirmCtx = ConfirmContext.get();
	let saveCtx = SaveContext.get();

	let addRosterOpen = $state(false);

	let rosterFilter: string | null = $state(null);

	const userIsAdmin = $derived(isAdmin(data.user?.role));

	const shownMatchIndicies = $derived(
		data.group.matches
			.map((match, index) => ({ match, index }))
			.filter(({ match }) => {
				if (!rosterFilter) return true;
				return isInMatch(match, rosterFilter);
			})
			.map(({ index }) => index)
	);

	async function save() {
		await updateGroup({
			id: data.group.id,
			name: data.group.name,
			matches: data.group.matches
		});
	}

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera grupp',
			description: `Är du säker på att du vill radera ${data.group.name} i ${data.group.division.name}, ${data.group.division.season.name} <b>tillsammans med ${data.group.rosters.length} rosters</b>?`,
			destructive: true,
			action: async () => {
				await deleteGroup({
					id: data.group.id
				});

				await goto(resolve(`/admin/division/${data.group.division.id}`));
			}
		});
	}

	async function submitNewRoster(name: string, teamId?: string) {
		const { roster } = await createRoster({
			groupId: data.group.id,
			name: name,
			teamId
		});

		await goto(resolve(`/admin/roster/${roster.id}`));
	}

	function addMatchAndEdit() {
		const match = createGroupMatch(data.group.id);

		data.group.matches.unshift(match);
		rosterCtx.editMatch(data.group.matches[0]);
		saveCtx.setDirty();
	}
</script>

<EditMatchDialog />

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: data.group.name, href: `/admin/grupp/${data.group.id}` }
	]}
/>

<AdminCard title="Lag">
	<AdminRosterList
		rosters={data.group.rosters}
		emptyText="Denna grupp har inga lag!"
		oncreateclick={() => (addRosterOpen = true)}
		showCheckins={season.checkinOpen}
		checkins={data.checkins}
	/>
</AdminCard>

<AdminCard title="Gruppspel">
	{#if data.group.matches.length === 0}
		<AdminEmptyNotice oncreateclick={addMatchAndEdit} hideCreateButton={!userIsAdmin}>
			Denna grupp har inga matcher.
		</AdminEmptyNotice>
	{:else}
		<Label label="Filtrera efter lag">
			<RosterSelect bind:selectedId={rosterFilter} class="grow" canClear />
		</Label>

		<div class="grid grid-cols-1 gap-2 overflow-hidden rounded-lg md:grid-cols-2">
			{#each shownMatchIndicies as matchIndex (data.group.matches[matchIndex].id)}
				{@const match = data.group.matches[matchIndex]}

				<EditableMatch
					{match}
					ondelete={() => {
						data.group.matches.splice(matchIndex, 1);
						saveCtx.setDirty();
					}}
				/>
			{/each}
		</div>

		{#if userIsAdmin}
			<Button icon="ph:plus" class="mt-2" onclick={addMatchAndEdit} />
		{/if}
	{/if}
</AdminCard>

{#if userIsAdmin}
	<AdminCard title="Inställningar">
		<Label label="Namn">
			<InputField bind:value={data.group.name} oninput={saveCtx.setDirty} />
		</Label>

		<Button icon="ph:trash" label="Radera grupp" kind="destructive" onclick={submitDelete} />
	</AdminCard>
{/if}

<CreateRosterDialog
	bind:open={addRosterOpen}
	onsubmit={submitNewRoster}
	excludeSeasonId={season.id}
/>
<EditMatchDialog />
<SaveToast />
