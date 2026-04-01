<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import RosterLogoUpload from '$lib/components/admin/RosterLogoUpload.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import { Rank, Role, SocialPlatform } from '$lib/types';
	import { formatSocialPlatform, flattenGroup } from '$lib/util';
	import TeamSelect from '$lib/components/admin/TeamSelect.svelte';
	import { deleteRoster, editRoster, mergeTeams, moveRoster } from '$lib/remote/roster.remote';
	import AdminMembersTable from '$lib/components/table/AdminMembersTable.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import { getDivisionsBySeason } from '$lib/remote/season.remote';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import { AuthRole, checkPermission } from '$lib/authRole';
	import AdminSocials from '$lib/components/admin/AdminSocials.svelte';

	let { data } = $props();

	$effect(() => {
		roster = data.roster;
		team = data.team;
	});

	let roster = $state(data.roster);
	let team = $state(data.team);

	let { group, division, season } = $derived(flattenGroup(roster.group));

	SaveContext.set(new SaveContext({ save, href: `/lag/${roster.slug}/${season.slug}` }));

	let confirm = ConfirmContext.get();
	let saveCtx = SaveContext.get();

	let newPlayerOpen = $state(false);
	let newPlayerBattletag = $state('');

	let linkTeamOpen = $state(false);
	let linkTeamId: string | undefined = $state();

	let changeGroupOpen = $state(false);
	let changeGroupTo = $state(group.id);

	let uploadedLogo = $state(false);

	const isAdmin = $derived(checkPermission(data.user?.role, AuthRole.ADMIN));

	async function save() {
		await editRoster({
			id: roster.id,
			teamId: team.id,
			name: roster.name,
			resigned: roster.resigned,
			members: roster.members,
			socials: team.socials
		});
	}

	async function addNewPlayer() {
		roster.members.push({
			isCaptain: false,
			role: Role.DAMAGE,
			rank: season.legacyRanks ? null : Rank.BRONZE,
			tier: season.legacyRanks ? null : 1,
			sr: season.legacyRanks ? 0 : null,
			player: {
				id: null as any as string, // the backend will either link this up with an existing player, or create a new one
				battletag: newPlayerBattletag
			}
		});

		saveCtx.setDirty();
		resetNewPlayer();
	}

	function resetNewPlayer() {
		newPlayerOpen = false;
		newPlayerBattletag = '';
	}

	async function onDeleteClick() {
		await confirm.confirm({
			title: 'Radera roster',
			description: `Är du säker på att du vill radera ${roster.name} från ${season.name}? <b>Detta går inte att ångra!</b>`,
			negative: true,
			action: async () => {
				await deleteRoster({
					id: roster.id
				});

				await goto(`/admin/grupp/${group.id}`);
			}
		});
	}

	async function linkTeam() {
		if (!linkTeamId) return;

		await mergeTeams({ teamAId: team.id, teamBId: linkTeamId });
		await invalidateAll();

		linkTeamOpen = false;
	}

	async function changeGroup() {
		if (!changeGroupTo) return;

		await moveRoster({ rosterId: roster.id, groupId: changeGroupTo });
		await invalidateAll();

		changeGroupOpen = false;
	}
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: group.name, href: `/admin/grupp/${group.id}` },
		{ label: roster.name, href: `/admin/roster/${roster.id}` }
	]}
/>

<AdminCard title="Spelare">
	{#if roster.members.length === 0}
		<AdminEmptyNotice oncreateclick={() => (newPlayerOpen = true)} hideCreateButton={!isAdmin}>
			Detta roster har inga medlemmar.
		</AdminEmptyNotice>
	{:else}
		<AdminMembersTable
			bind:members={roster.members}
			legacyRanks={season.legacyRanks}
			disabled={!isAdmin}
			ondelete={(index) => {
				roster.members.splice(index, 1);
			}}
		/>

		{#if isAdmin}
			<Button kind="primary" icon="ph:plus" onclick={() => (newPlayerOpen = true)} />
		{/if}
	{/if}
</AdminCard>

{#if isAdmin}
	<AdminSocials
		emptyText="Detta lag har inga länkade sociala medier."
		bind:socials={team.socials}
	/>

	<AdminCard title="Inställningar">
		<Label label="Namn">
			<InputField bind:value={roster.name} oninput={saveCtx.setDirty} />
		</Label>

		<Label label="Resignerad">
			<Checkbox bind:checked={roster.resigned} onCheckedChange={saveCtx.setDirty} />
		</Label>

		<Label label="Logotyp">
			<RosterLogoUpload rosterId={roster.id} onUpload={() => (uploadedLogo = true)} />
		</Label>

		{#if uploadedLogo}
			<Notice kind="info">
				Logotypen har laddats upp! Det kan dröja några minuter innan uppdateringen syns på hemsidan.
			</Notice>
		{/if}

		<div class="flex items-center gap-2">
			<Button
				icon="ph:swap"
				label="Flytta"
				kind="secondary"
				onclick={() => (changeGroupOpen = true)}
			/>

			<Button icon="ph:trash" label="Radera roster" kind="negative" onclick={onDeleteClick} />
		</div>
	</AdminCard>

	<AdminCard title="Länkade rosters">
		{#if team.rosters.length > 1}
			<div class="space-y-1 overflow-hidden rounded-lg">
				{#each team.rosters as otherRoster (otherRoster.id)}
					{@const { division, season } = flattenGroup(otherRoster.group)}

					{#if otherRoster.id != roster.id}
						<AdminLink href="/admin/roster/{otherRoster.id}">
							{season.name}, {division.name}
							{#if otherRoster.name != roster.name}
								({otherRoster.name})
							{/if}
						</AdminLink>
					{/if}
				{/each}

				<Button icon="ph:link" class="mt-2" onclick={() => (linkTeamOpen = true)} />
			</div>
		{:else}
			<AdminEmptyNotice
				createButtonLabel="Länka"
				createButtonIcon="ph:link"
				oncreateclick={() => (linkTeamOpen = true)}
				>{roster.name} är inte länkat till något annat roster.
			</AdminEmptyNotice>
		{/if}
	</AdminCard>
{/if}

<CreateDialog
	title="Lägg till spelare"
	bind:open={newPlayerOpen}
	oncreate={addNewPlayer}
	onclose={resetNewPlayer}
	disabled={!newPlayerBattletag}
>
	<Label label="Battletag">
		<InputField bind:value={newPlayerBattletag} placeholder="Spelare#0000" />
	</Label>
</CreateDialog>

<CreateDialog
	title="Länka roster"
	createLabel="Länka"
	oncreate={linkTeam}
	onclose={() => (linkTeamId = undefined)}
	bind:open={linkTeamOpen}
	disabled={!linkTeamId}
>
	{#snippet description()}
		Välj vilket lag du vill länka {roster.name} till. Tänk på att det inte går att länka två rosters
		från samma säsong.
	{/snippet}

	<Label label="Lag">
		<TeamSelect excludeSeasonId={season.id} excludeTeamId={team.id} bind:value={linkTeamId} />
	</Label>
</CreateDialog>

<CreateDialog
	title="Flytta roster"
	createLabel="Flytta"
	oncreate={changeGroup}
	bind:open={changeGroupOpen}
	disabled={!changeGroupTo}
>
	<Label label="Grupp">
		{#await getDivisionsBySeason({ seasonId: season.id }) then { divisions }}
			<Select
				type="single"
				class="grow"
				items={divisions.flatMap((division) =>
					division.groups.map((group) => ({
						label: `${division.name}, ${group.name}`,
						value: group.id
					}))
				)}
				bind:value={changeGroupTo}
				placeholder="Välj grupp"
			/>
		{/await}
	</Label>
</CreateDialog>

<SaveToast />
