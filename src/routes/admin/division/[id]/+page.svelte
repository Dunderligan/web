<script lang="ts">
	const { data } = $props();

	const division = $derived(data.division);
	const season = $derived(division.season);
</script>

<div class="space-y-6">
	<a class="text-xl font-semibold" href="/admin/sasong/{season.id}">{season.name}</a>
	<h1 class="text-4xl font-bold">{division.name}</h1>

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
</div>
