<script lang="ts">
	const { data } = $props();

	const season = $derived(data.season);
</script>

<div class="space-y-6">
	<h1 class="text-4xl font-bold">{season.name}</h1>

	<table class="w-full">
		<thead>
			<tr>
				<th> Namn </th>
				<th> </th>
			</tr>
		</thead>
		<tbody>
			{#each season.divisions as { id, name, slug }, i (id)}
				<tr>
					<td>
						<a href="/admin/division/{id}">{name}</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
