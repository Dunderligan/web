<script lang="ts">
	import { goto } from '$app/navigation';
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
	import Table from '$lib/components/table/Table.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import { Rank, Role, SocialPlatform } from '$lib/types';
	import {
		formatSocialPlatform,
		flattenGroup,
		capitalize,
		enumToPgEnum,
		roleIcon
	} from '$lib/util';
	import { createRoster, deleteRoster, editRoster, editRosterTeam } from './page.remote';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import TeamSelect from '$lib/components/admin/TeamSelect.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';

	let { data } = $props();

	$effect(() => {
		roster = data.roster;
		team = data.team;
	});

	let roster = $state(data.roster);
	let team = $state(data.team);

	let { group, division, season } = $derived(flattenGroup(roster.group));

	SaveContext.set(new SaveContext({ save, href: `/lag/${roster.slug}/${season.slug}` }));

	let newPlayerOpen = $state(false);
	let newPlayerBattletag = $state('');

	let remainingPlatforms = $derived(
		Object.values(SocialPlatform).filter(
			(platform) => !team.socials.some((social) => social.platform === platform)
		)
	);

	let newSocialOpen = $state(false);
	let newPlatform = $state(SocialPlatform.TWITTER);
	let newSocialUrl = $state('');

	let linkTeamOpen = $state(false);
	let linkTeamId: string | undefined = $state();

	let confirm = ConfirmContext.get();
	let saveCtx = SaveContext.get();

	async function save() {
		const { slug } = await editRoster({
			id: roster.id,
			teamId: team.id,
			name: roster.name,
			members: roster.members,
			socials: team.socials
		});

		// await goto(`/lag/${slug}/${season.slug}`);
		saveCtx.setDirty();
	}

	async function addNewPlayer() {
		roster.members.push({
			isCaptain: false,
			rank: Rank.BRONZE,
			tier: 1,
			role: Role.DAMAGE,
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

	async function submitNewSocial() {
		team.socials.push({
			platform: newPlatform,
			url: newSocialUrl
		});

		saveCtx.setDirty();
		resetNewSocial();
	}

	function resetNewSocial() {
		newSocialOpen = false;
		newSocialUrl = '';

		if (remainingPlatforms.length > 0) {
			newPlatform = remainingPlatforms[0];
		}
	}

	async function submitDelete() {
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

		await editRosterTeam({ rosterId: roster.id, teamId: linkTeamId });
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
		<AdminEmptyNotice oncreateclick={() => (newPlayerOpen = true)}>
			Detta roster har inga medlemmar.
		</AdminEmptyNotice>
	{:else}
		<Table
			columns={[{ label: 'Battletag', center: false }, 'Kapten', 'Roll', 'Rank', '']}
			rows={roster.members}
			class="grid-cols-[1fr_80px_160px_250px_50px]"
		>
			{#snippet row({ value: member, index })}
				<div class="flex items-center bg-gray-200 px-6 py-4 text-lg font-semibold">
					{member.player.battletag}
				</div>

				<div class="flex items-center justify-center gap-2 bg-gray-200 pr-2">
					<Checkbox bind:checked={member.isCaptain} onCheckedChange={saveCtx.setDirty} />
				</div>

				<div class="flex items-center bg-gray-200 pr-4">
					<Select
						type="single"
						triggerClass="grow"
						bind:value={member.role}
						onValueChange={saveCtx.setDirty}
						itemIcon={(role) => roleIcon(role as Role)}
						items={enumToPgEnum(Role).map((role) => ({
							label: capitalize(role),
							value: role
						}))}
					/>
				</div>

				<div class="flex items-center gap-2 bg-gray-200 pr-2">
					<Select
						type="single"
						triggerClass="grow"
						bind:value={member.rank}
						onValueChange={saveCtx.setDirty}
						items={enumToPgEnum(Rank).map((rank) => ({
							label: capitalize(rank),
							value: rank
						}))}
					>
						{#snippet itemSnippet({ value })}
							<img src="/rank/{value}.png" alt="" class="-m-1 mr-2 size-8" />
						{/snippet}
					</Select>

					<Select
						type="single"
						triggerClass="w-1/4"
						bind:value={() => member.tier.toString(), (str) => (member.tier = parseInt(str))}
						onValueChange={saveCtx.setDirty}
						items={[1, 2, 3, 4, 5].map((tier) => ({
							label: tier.toString(),
							value: tier.toString()
						}))}
					/>
				</div>

				<div class="flex items-center bg-gray-200 pr-4">
					<Button
						title="Ta bort"
						icon="ph:trash"
						kind="tertiary"
						onclick={() => {
							roster.members.splice(index, 1);
							saveCtx.setDirty();
						}}
					/>
				</div>
			{/snippet}
		</Table>

		<Button kind="primary" icon="ph:plus" onclick={() => (newPlayerOpen = true)} />
	{/if}
</AdminCard>

<AdminCard title="Sociala medier">
	{#if team.socials.length === 0}
		<AdminEmptyNotice oncreateclick={() => (newSocialOpen = true)}>
			Detta lag har inga länkade sociala medier.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1.5 py-1">
			{#each team.socials as social, i (social.platform)}
				<Label>
					{#snippet label()}
						<Icon class="text-2xl" icon="ph:{social.platform}-logo-fill" />
						{formatSocialPlatform(social.platform)}
					{/snippet}

					<InputField bind:value={social.url} placeholder="URL" />

					<Button
						icon="ph:trash"
						class="ml-2"
						kind="tertiary"
						title="Radera"
						onclick={() => {
							team.socials.splice(i, 1);
							saveCtx.setDirty();
						}}
					/>
				</Label>
			{/each}
		</div>

		{#if remainingPlatforms.length > 0}
			<Button icon="ph:plus" onclick={() => (newSocialOpen = true)} />
		{/if}
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={roster.name} oninput={saveCtx.setDirty} />
	</Label>

	<Label label="Logotyp">
		<RosterLogoUpload rosterId={roster.id} />
	</Label>

	<Button icon="ph:trash" label="Radera roster" kind="negative" onclick={submitDelete} />
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

<CreateDialog
	title="Lägg till social media"
	bind:open={newSocialOpen}
	oncreate={submitNewSocial}
	onclose={resetNewSocial}
	disabled={!newSocialUrl || !newPlatform}
>
	<Label label="Platform">
		<Select
			type="single"
			triggerClass="grow"
			bind:value={newPlatform}
			itemIcon={(platform) => `ph:${platform}-logo-fill`}
			items={remainingPlatforms.map((platform) => ({
				label: formatSocialPlatform(platform),
				value: platform
			}))}
		/>
	</Label>

	<Label label="URL">
		<InputField bind:value={newSocialUrl} placeholder="https://{newPlatform}.com/..." />
	</Label>
</CreateDialog>

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
	<Label label="Lag">
		<TeamSelect excludeSeasonId={season.id} bind:value={linkTeamId} />
	</Label>
</CreateDialog>

<SaveToast />
