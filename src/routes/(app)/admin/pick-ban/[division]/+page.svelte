<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';

	const { data } = $props();

	const configs = $state(data.configs);

	const division = $derived(data.division);
	const season = $derived(division.season);
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` }
	]}
/>

<AdminCard title="Inställningar">
	{JSON.stringify(configs, null, 2)}
</AdminCard>
