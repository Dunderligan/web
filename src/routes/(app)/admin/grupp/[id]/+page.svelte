<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import CreateDialog from '$lib/components/CreateDialog.svelte';
	import EditableMatch from '$lib/components/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Label from '$lib/components/Label.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import SaveToast from '$lib/components/SaveToast.svelte';
	import TeamSelect from '$lib/components/TeamSelect.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte.js';
	import { SaveContext } from '$lib/state/save.svelte';
	import { createAndAddRoster, deleteGroup, updateGroup } from './page.remote';
	import { v4 as uuidv4 } from 'uuid';

	const { data } = $props();

	let group = $state(data.group);

	const { season, division } = $derived(data);

	RosterContext.set(new RosterContext(data.group.rosters));
	SaveContext.set(new SaveContext(save));

	let rosterCtx = RosterContext.get();
	let confirmCtx = ConfirmContext.get();
	let saveCtx = SaveContext.get();

	let addRosterOpen = $state(false);

	let newRosterTeamId: string | undefined = $state();
	let newRosterName = $state('');

	$effect(() => {
		group = data.group;
		// rosterCtx.set(group.rosters);
	});

	async function save() {
		await updateGroup({
			id: group.id,
			name: group.name,
			matches: group.matches
		});
	}

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera grupp',
			description: `Är du säker på att du vill radera ${group.name} i ${season.name}, ${division.name} <b>tillsammans med ${group.rosters.length} rosters</b>?`,
			negative: true,
			action: async () => {
				await deleteGroup({
					id: group.id
				});

				await goto(`/admin/division/${division.id}`);
			}
		});
	}

	async function submitNewRoster() {
		const { roster } = await createAndAddRoster({
			groupId: group.id,
			seasonSlug: season.slug,
			name: newRosterName,
			teamId: newRosterTeamId ?? null
		});

		await goto(`/admin/roster/${roster.id}`);
	}

	function addMatchAndEdit() {
		const match = {
			id: uuidv4(),
			groupId: data.group.id,
			played: false,
			divisionId: null,
			draws: null,
			nextMatchId: null,
			playedAt: null,
			rosterAId: null,
			rosterBId: null,
			scheduledAt: null,
			teamAScore: null,
			teamBScore: null,
			vodUrl: null,
			createdAt: null,
			order: null
		};

		group.matches.unshift(match);
		rosterCtx.editMatch(group.matches[0]);
		saveCtx.setDirty();
	}
</script>

<EditMatchDialog />

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: group.name, href: `/admin/grupp/${group.id}` }
	]}
/>

<AdminCard title="Lag">
	{#if group.rosters.length === 0}
		<AdminEmptyNotice oncreateclick={() => (addRosterOpen = true)}>
			Denna grupp har inga lag.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each group.rosters as { id, name } (id)}
				<AdminLink href="/admin/roster/{id}">
					<RosterLogo {id} class="mr-2 inline size-12" />
					{name}</AdminLink
				>
			{/each}
		</div>

		<Button icon="mdi:add" class="mt-2" onclick={() => (addRosterOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Gruppspel">
	{#if group.matches.length === 0}
		<AdminEmptyNotice oncreateclick={addMatchAndEdit}>
			Denna grupp har inga matcher.
		</AdminEmptyNotice>
	{:else}
		<div class="max-w-sm space-y-2 overflow-hidden rounded-lg">
			{#each group.matches as match, i (match.id)}
				<EditableMatch
					{match}
					ondelete={() => {
						group.matches.splice(i, 1);
						saveCtx.setDirty();
					}}
				/>
			{/each}
		</div>

		<Button icon="mdi:add" class="mt-2" onclick={addMatchAndEdit} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={group.name} oninput={saveCtx.setDirty} />
	</Label>

	<Button icon="mdi:trash-can" label="Radera grupp" kind="negative" onclick={submitDelete} />
</AdminCard>

<CreateDialog
	title="Skapa roster"
	bind:open={addRosterOpen}
	oncreate={submitNewRoster}
	onclose={() => {
		newRosterTeamId = undefined;
		newRosterName = '';
	}}
	disabled={!newRosterName.trim()}
>
	<Label label="Lag">
		<TeamSelect bind:value={newRosterTeamId} excludeGroupId={group.id} />
	</Label>

	<Label label="Namn">
		<InputField
			bind:value={newRosterName}
			placeholder="T.ex. Groot Gaming..."
			onenter={submitNewRoster}
		/>
	</Label>

	<!-- <Label label="Existerande lag?">
		<input type="checkbox" bind:checked={newRosterHasTeam} />
	</Label>

	{#if newRosterHasTeam}
		<Label label="Lag">
			<Select
				type="single"
				bind:value={newRosterTeamId}
				placeholder="Välj lag..."
				triggerClass="grow"
				items={teams.map((team) => ({
					label: team.rosters[0].name,
					value: team.id
				}))}
			>
				{#snippet itemSnippet({ value })}
					<RosterLogo id={value} class="mr-2 size-6" />
				{/snippet}
			</Select>
		</Label>
	{/if} -->
</CreateDialog>

<SaveToast />
<EditMatchDialog />
