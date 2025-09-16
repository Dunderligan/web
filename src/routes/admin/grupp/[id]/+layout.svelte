<script lang="ts">
	const { data, children } = $props();

	const { season, division, group } = $derived(data);
</script>

<div class="space-y-6">
	<a class="text-xl font-semibold" href="/admin/sasong/{season.id}">{season.name}</a>
	<span> - </span>
	<a class="text-xl font-semibold" href="/admin/division/{division.id}">{division.name}</a>
	<h1 class="text-4xl font-bold">{group.name}</h1>

	<div>
		<a href="lag">Lag</a>
		<a href="gruppspel">Gruppspel</a>
		<a href="slutspel">Slutspel</a>
	</div>

	{@render children()}
</div>
