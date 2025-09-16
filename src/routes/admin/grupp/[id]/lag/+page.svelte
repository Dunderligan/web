<script lang="ts">
	const { data } = $props();

	const { season, division, group, rosters } = $derived(data);
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
			{#each rosters as [id, { name }], i (id)}
				<tr>
					<td>
						<a href="/admin/roster/{id}">{name}</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
