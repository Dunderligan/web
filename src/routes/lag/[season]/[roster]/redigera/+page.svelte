<script lang="ts">
	import { goto } from '$app/navigation';
	import { Rank, Role } from '$lib/util';
	import { editRoster } from './page.remote';

	let { data } = $props();

	let { roster } = $state(data);

	let newBattletag = $state('');

	async function submitEdit() {
		const { location } = await editRoster({
			id: roster.id,
			name: roster.name,
			members: roster.members
		});

		await goto(location);
	}

	$inspect(roster.members);
</script>

<form>
	<label>
		Namn
		<input type="text" bind:value={roster.name} />
	</label>

	<table>
		<thead>
			<tr>
				<th>Battletag</th>
				<th>Roll</th>
				<th>Rank</th>
				<th>Kapten</th>
				<th>Actions</th>
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
						<button onclick={() => roster.members.splice(i, 1)}>Remove</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div>
		<input type="text" placeholder="Battletag" bind:value={newBattletag} />

		<button
			onclick={() =>
				roster.members.push({
					isCaptain: false,
					rank: Rank.BRONZE,
					tier: 1,
					role: Role.DAMAGE,
					player: {
						id: null,
						battletag: newBattletag
					}
				})}>Lägg till</button
		>
	</div>

	<button
		class="block"
		onclick={async (evt) => {
			evt.preventDefault();
			await submitEdit();
		}}
	>
		Save
	</button>
</form>
