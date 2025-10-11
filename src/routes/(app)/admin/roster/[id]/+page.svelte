<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Label from '$lib/components/Label.svelte';
	import Notice from '$lib/components/Notice.svelte';
	import RosterLogo from '$lib/components/RosterLogo.svelte';
	import Select from '$lib/components/Select.svelte';
	import Table from '$lib/components/Table.svelte';
	import { Rank, Role, SocialPlatform } from '$lib/types';
	import {
		formatSocialPlatform,
		flattenGroup,
		capitalize,
		enumToPgEnum,
		roleIcon
	} from '$lib/util';
	import { createRoster, editRoster, uploadLogo } from './page.remote';

	let { data } = $props();

	$effect(() => {
		roster = data.roster;
		team = data.team;
	});

	let roster = $state(data.roster);
	let team = $state(data.team);
	let { group, division, season } = $derived(flattenGroup(roster.group));

	let newBattletag = $state('');

	let remainingPlatforms = $derived(
		Object.values(SocialPlatform).filter(
			(platform) => !team.socials.some((social) => social.platform === platform)
		)
	);

	let newSocialOpen = $state(false);
	let newPlatform = $state(SocialPlatform.TWITTER);
	let newSocialUrl = $state('');

	let newGroupId = $state('');

	async function submitEdit() {
		const { slug } = await editRoster({
			id: roster.id,
			teamId: team.id,
			name: roster.name,
			members: roster.members,
			socials: team.socials
		});

		await goto(`/lag/${season.slug}/${slug}`);
	}

	async function addNewPlayer() {
		roster.members.push({
			isCaptain: false,
			rank: Rank.BRONZE,
			tier: 1,
			role: Role.DAMAGE,
			player: {
				id: null, // the backend will either link this up with an existing player, or create a new one
				battletag: newBattletag
			}
		});

		newBattletag = '';
	}

	async function addSocial() {
		team.socials.push({
			platform: newPlatform,
			url: newSocialUrl
		});

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

		await goto(`admin/roster/${roster.id}`);
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
	<Table
		columns={[{ label: 'Battletag', center: false }, 'Roll', 'Rank', '']}
		rows={roster.members}
		class="grid-cols-[1fr_160px_250px_50px]"
	>
		{#snippet row({ value: member })}
			<div class="flex items-center bg-gray-200 px-6 py-4 text-lg font-semibold">
				{member.player.battletag}
			</div>

			<div class="flex items-center bg-gray-200 pr-4">
				<Select
					type="single"
					triggerClass="grow"
					bind:value={member.role}
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
					bind:value={() => member.tier.toString(), (str) => parseInt(str)}
					items={[1, 2, 3, 4, 5].map((tier) => ({
						label: tier.toString(),
						value: tier.toString()
					}))}
				/>
			</div>

			<div class="flex items-center bg-gray-200 pr-4">
				<Button title="Ta bort" icon="mdi:remove" kind="tertiary" />
			</div>
		{/snippet}
	</Table>
</AdminCard>

<AdminCard title="Sociala medier">
	{#if team.socials.length === 0}
		<Notice kind="info"
			>Detta lag har inga länkade sociala medier.

			<Button
				icon="mdi:add"
				label="Lägg till"
				kind="transparent"
				class="ml-auto"
				onclick={() => (newSocialOpen = true)}
			/>
		</Notice>
	{:else}
		<div class="space-y-1.5 overflow-hidden rounded-lg py-1">
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
						onclick={() => team.socials.splice(i, 1)}
					/>
				</Label>
			{/each}
		</div>

		{#if remainingPlatforms.length > 0}
			<Button icon="mdi:add" kind="secondary" onclick={() => (newSocialOpen = true)} />
		{/if}
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={roster.name} />
	</Label>

	<Label label="Logotyp">
		<form {...uploadLogo} enctype="multipart/form-data">
			<label class="group relative flex size-24 cursor-pointer items-center justify-center">
				<RosterLogo
					id={roster.id}
					class="absolute -z-10 h-full w-full transition-all group-hover:brightness-75"
					imgSize={128}
				/>
				<div
					class="hidden items-center justify-center rounded-lg bg-gray-600 p-2 text-xl text-white group-hover:flex"
				>
					<Icon icon="mdi:upload" />
				</div>
				<input type="file" name="file" accept="image/png" class="hidden" />
			</label>
			<input type="text" name="rosterId" value={roster.id} class="hidden" />
		</form>
	</Label>

	<Button icon="mdi:delete" label="Radera roster" kind="negative" />
</AdminCard>

<form>
	<div>
		<h2 class="text-xl font-semibold">Spelare</h2>

		<table class="w-full">
			<thead>
				<tr>
					<th>Battletag</th>
					<th>Roll</th>
					<th>Rank</th>
					<th>Kapten</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each roster.members as member, i}
					<tr>
						<td>
							{member.player.battletag}
						</td>
						<td>
							<select bind:value={member.role}>
								<option value="tank">Tank</option>
								<option value="damage">Damage</option>
								<option value="support">Support</option>
							</select>
						</td>
						<td>
							<div class="inline-block">
								<select bind:value={member.rank}>
									<option value="bronze">Bronze</option>
									<option value="silver">Silver</option>
									<option value="gold">Gold</option>
									<option value="platinum">Platinum</option>
									<option value="diamond">Diamond</option>
									<option value="master">Master</option>
									<option value="grandmaster">Grandmaster</option>
									<option value="champion">Champion</option>
								</select>
							</div>
							<div class="inline-block">
								<select
									bind:value={() => member.tier.toString(), (str) => (member.tier = parseInt(str))}
								>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">5</option>
								</select>
							</div>
						</td>
						<td>
							<input type="checkbox" bind:checked={member.isCaptain} />
						</td>
						<td> </td>
					</tr>
				{/each}
				<tr>
					<td>
						<input
							type="text"
							placeholder="Battletag"
							bind:value={newBattletag}
							onchange={addNewPlayer}
						/>
					</td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
				</tr>
			</tbody>
		</table>
	</div>

	<div>
		<h2 class="text-xl font-semibold">Alla rosters</h2>

		<table class="w-full">
			<thead>
				<tr>
					<th> Namn </th>
					<th> Säsong </th>
					<th> Division </th>
					<th> Grupp </th>
					<th> </th>
				</tr>
			</thead>
			<tbody>
				{#each team.rosters as roster (roster.id)}
					{@const isCurrent = data.roster.id === roster.id}
					{@const { group, division, season } = flattenGroup(roster.group)}

					<tr>
						<td>
							{#if isCurrent}
								&rang;
							{/if}

							{roster.name}
						</td>
						<td>
							{season.name}
						</td>
						<td>
							{division.name}
						</td>
						<td>
							{group.name}
						</td>
						<td>
							{#if !isCurrent}
								<a href="/lag/{season.slug}/{roster.slug}/redigera">Redigera</a>
							{/if}

							<button>Radera</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="mt-2">
			<button onclick={submitNewRoster}>Skapa roster</button>
		</div>
	</div>

	<button
		class="block bg-black px-4 py-2 text-white"
		onclick={async (evt) => {
			evt.preventDefault();
			await submitEdit();
		}}
	>
		Spara
	</button>
</form>

<Dialog
	title="Lägg till social media"
	bind:open={newSocialOpen}
	buttons={[
		{
			label: 'Avbryt',
			kind: 'secondary',
			onclick: resetNewSocial
		},
		{
			icon: 'mdi:create',
			label: 'Skapa',
			kind: 'primary',
			onclick: addSocial,
			disabled: !newSocialUrl || !newPlatform
		}
	]}
>
	<Label label="Platform">
		<Select
			type="single"
			triggerClass="grow"
			bind:value={newPlatform}
			items={remainingPlatforms.map((platform) => ({
				label: formatSocialPlatform(platform),
				value: platform,
				icon: `mdi:${platform}`
			}))}
		/>
	</Label>
	<Label label="URL">
		<InputField bind:value={newSocialUrl} placeholder="https://x.com/..." />
	</Label>
</Dialog>
