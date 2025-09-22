<script lang="ts">
	let { data } = $props();
</script>

<div class="space-y-6">
	<h1 class="text-4xl font-bold">Admin</h1>

	<h1 class="text-2xl font-semibold">Säsonger</h1>

	<table class="w-full">
		<thead>
			<tr>
				<th> Namn </th>
				<th> Inleddes </th>
				<th> Avslutades </th>
			</tr>
		</thead>
		<tbody>
			{#each data.seasons as season (season.id)}
				<tr>
					<td>
						<a href="/admin/sasong/{season.id}">{season.name}</a>
					</td>
					<td>
						{season.startedAt.toLocaleDateString()}
					</td>
					<td>
						{season.endedAt?.toLocaleDateString() ?? 'N/A'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
