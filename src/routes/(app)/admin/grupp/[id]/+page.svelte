<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EditableMatch from '$lib/components/match/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/match/EditMatchDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import RosterLogo from '$lib/components/ui/RosterLogo.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import { v4 as uuidv4 } from 'uuid';
	import CreateRosterDialog from '$lib/components/admin/CreateRosterDialog.svelte';
	import { deleteGroup, updateGroup } from '$lib/remote/group.remote';
	import { createRoster } from '$lib/remote/roster.remote';
	import { isInMatch } from '$lib/match.js';
	import RosterSelect from '$lib/components/admin/RosterSelect.svelte';

	const { data } = $props();

	let group = $state(data.group);
	let division = $state(data.division);
	let season = $state(data.season);

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

	const shownMatchIndicies = $derived(
		group.matches
			.map((match, index) => ({ match, index }))
			.filter(({ match, index }) => {
				if (!rosterFilter) return true;
				return isInMatch(match, rosterFilter);
			})
			.map(({ index }) => index)
	);

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

	async function submitNewRoster(name: string, teamId?: string) {
		const { roster } = await createRoster({
			groupId: group.id,
			seasonSlug: season.slug,
			name: name,
			teamId
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

		<Button icon="ph:plus" class="mt-2" onclick={() => (addRosterOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Gruppspel">
	{#if group.matches.length === 0}
		<AdminEmptyNotice oncreateclick={addMatchAndEdit}>
			Denna grupp har inga matcher.
		</AdminEmptyNotice>
	{:else}
		<Label label="Filtrera efter lag">
			<RosterSelect bind:selectedId={rosterFilter} class="grow" />
		</Label>

		<div class="grid grid-cols-1 gap-2 overflow-hidden rounded-lg md:grid-cols-2">
			{#each shownMatchIndicies as matchIndex (group.matches[matchIndex].id)}
				{@const match = group.matches[matchIndex]}

				<EditableMatch
					{match}
					ondelete={() => {
						group.matches.splice(matchIndex, 1);
						saveCtx.setDirty();
					}}
				/>
			{/each}
		</div>

		<Button icon="ph:plus" class="mt-2" onclick={addMatchAndEdit} />
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={group.name} oninput={saveCtx.setDirty} />
	</Label>

	<Button icon="ph:trash" label="Radera grupp" kind="negative" onclick={submitDelete} />
</AdminCard>

<CreateRosterDialog
	bind:open={addRosterOpen}
	onsubmit={submitNewRoster}
	excludeSeasonId={season.id}
/>
<EditMatchDialog />
<SaveToast />
