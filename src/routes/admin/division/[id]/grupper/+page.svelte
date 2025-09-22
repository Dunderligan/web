<script lang="ts">
	import Dialog from '$lib/components/Dialog.svelte';
	import { createGroup } from './page.remote';

	const { data } = $props();

	const division = $state(data.division);

	let createDialogOpen = $state(false);
	let newGroupName = $state('');

	async function submitGroup() {
		const { group } = await createGroup({
			name: newGroupName,
			divisionId: division.id
		});

		division.groups.push(group);
		createDialogOpen = false;
		newGroupName = '';
	}
</script>

<table class="w-full">
	<thead>
		<tr>
			<th> Namn </th>
		</tr>
	</thead>
	<tbody>
		{#each division.groups as { id, name, slug }, i (id)}
			<tr>
				<td>
					<a href="/admin/grupp/{id}">{name}</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<Dialog title="Skapa grupp" bind:open={createDialogOpen}>
	<input type="text" bind:value={newGroupName} />
	<button onclick={submitGroup}>Skapa</button>
</Dialog>
