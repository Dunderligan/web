<script lang="ts">
	import { goto } from '$app/navigation';
	import { Rank, Role, SocialPlatform } from '$lib/types';
	import { formatSocialPlatform, flattenGroup } from '$lib/util';
	import { createRoster, editRoster, uploadLogo } from './page.remote';

	let { data } = $props();

	$effect(() => {
		roster = data.roster;
		team = data.team;
	});

	let { roster, team } = $state(data);
	let { group, division, season } = $derived(flattenGroup(roster.group));

	let newBattletag = $state('');

	let remainingPlatforms = $derived(
		Object.values(SocialPlatform).filter(
			(platform) => !team.socials.some((social) => social.platform === platform)
		)
	);

	let newPlatform = $state(SocialPlatform.TWITTER);
	let newSocialUrl = $state('');

	let newGroupId = $state('');

	async function submitEdit() {
		await editRoster({
			id: roster.id,
			teamId: team.id,
			name: roster.name,
			members: roster.members,
			socials: team.socials
		});

		await goto(`/lag/${season.slug}/${roster.slug}`);
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

		if (remainingPlatforms.length > 0) {
			newPlatform = remainingPlatforms[0];
		}

		newSocialUrl = '';
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

<form {...uploadLogo}>
	<input type="file" name="file" accept="application/png" />
	<input type="text" name="rosterId" value={roster.id} />
	<button>Upload</button>
</form>

<form class="mt-6 space-y-6">
	<div>
		<div class="flex items-center text-lg font-semibold">
			<a href="/admin/sasong/{season.id}">{season.name}</a>
			<a href="/admin/division/{division.id}">{division.name}</a>
			<a href="/admin/grupp/{group.id}">{group.name}</a>
		</div>

		<label class="mt-2 block">
			Namn
			<input type="text" bind:value={roster.name} />
		</label>
	</div>

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
						<td>
							<button onclick={() => roster.members.splice(i, 1)}>Ta bort</button>
						</td>
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
		<h2 class="text-xl font-semibold">Sociala medier</h2>

		<table class="w-full">
			<thead>
				<tr>
					<th>Platform</th>
					<th>URL</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each team.socials as social, i (social.platform)}
					<tr>
						<td>
							{formatSocialPlatform(social.platform)}
						</td>

						<td>
							<input class="w-full" type="text" bind:value={social.url} placeholder="URL" />
						</td>

						<td>
							<button onclick={() => team.socials.splice(i, 1)}>Ta bort</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if remainingPlatforms.length > 0}
			<div class="mt-2">
				<select bind:value={newPlatform}>
					{#each remainingPlatforms as platform}
						<option value={platform}>{formatSocialPlatform(platform)}</option>
					{/each}
				</select>

				<input type="text" bind:value={newSocialUrl} placeholder="URL" />

				<button onclick={addSocial}>Lägg till</button>
			</div>
		{/if}
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
