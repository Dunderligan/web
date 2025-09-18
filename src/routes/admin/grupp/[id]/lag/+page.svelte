<script lang="ts">
	import { RosterState } from '$lib/state/rosters.svelte.js';

	const { data } = $props();

	const { season, division, group } = $derived(data);

	const rosters = RosterState.get();
</script>

<div class="space-y-6">
	<table class="w-full">
		<thead>
			<tr>
				<th> Namn </th>
				<th> </th>
			</tr>
		</thead>
		<tbody>
			{#each rosters.map as [id, { name }], i (id)}
				<tr>
					<td>
						<a href="/admin/roster/{id}">{name}</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
