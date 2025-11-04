<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import CreateDialog from '$lib/components/CreateDialog.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Label from '$lib/components/Label.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import RosterLogoUpload from '$lib/components/RosterLogoUpload.svelte';
	import SaveToast from '$lib/components/SaveToast.svelte';
	import Select from '$lib/components/Select.svelte';
	import Table from '$lib/components/Table.svelte';
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
	import { createRoster, deleteRoster, editRoster } from './page.remote';

	let { data } = $props();

	SaveContext.set(new SaveContext(save));

	$effect(() => {
		roster = data.roster;
		team = data.team;
	});

	let roster = $state(data.roster);
	let team = $state(data.team);
	let { group, division, season } = $derived(flattenGroup(roster.group));

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

	let newGroupId = $state('');

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

		// await goto(`/lag/${season.slug}/${slug}`);
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

	async function submitNewRoster() {
		await createRoster({
			name: roster.name + ' version 2',
			groupId: newGroupId,
			teamId: team.id
		});

		newGroupId = '';

		await goto(`/admin/roster/${roster.id}`);
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
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: group.name, href: `/admin/grupp/${group.id}` },
		{ label: roster.name, href: `/admin/roster/${roster.id}` }
	]}
/>

<AdminCard title="Medlemmar">
	{#if roster.members.length === 0}
		<AdminEmptyNotice oncreateclick={() => (newPlayerOpen = true)}>
			Detta roster har inga medlemmar.
		</AdminEmptyNotice>
	{:else}
		<Table
			columns={[{ label: 'Battletag', center: false }, 'Roll', 'Rank', '']}
			rows={roster.members}
			class="grid-cols-[1fr_160px_250px_50px]"
		>
			{#snippet row({ value: member, index })}
				<div class="flex items-center bg-gray-200 px-6 py-4 text-lg font-semibold">
					{member.player.battletag}
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
						icon="mdi:remove"
						kind="tertiary"
						onclick={() => {
							roster.members.splice(index, 1);
							saveCtx.setDirty();
						}}
					/>
				</div>
			{/snippet}
		</Table>

		<Button kind="primary" icon="mdi:add" onclick={() => (newPlayerOpen = true)} />
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
						<Icon class="text-2xl" icon="mdi:{social.platform}" />
						{formatSocialPlatform(social.platform)}
					{/snippet}

					<InputField bind:value={social.url} placeholder="URL" />

					<Button
						icon="mdi:delete"
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
			<Button icon="mdi:add" onclick={() => (newSocialOpen = true)} />
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

	<Button icon="mdi:delete" label="Radera roster" kind="negative" onclick={submitDelete} />
</AdminCard>

{#if team.rosters.length > 1}
	<AdminCard title="Andra rosters">
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
	</AdminCard>
{/if}

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
			itemIcon={(platform) => `mdi:${platform}`}
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
	onclose={resetNewPlayer}
	oncreate={addNewPlayer}
	disabled={!newPlayerBattletag}
>
	<Label label="Battletag">
		<InputField bind:value={newPlayerBattletag} placeholder="Spelare#0000" />
	</Label>
</CreateDialog>

<SaveToast />
