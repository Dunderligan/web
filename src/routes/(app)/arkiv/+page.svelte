<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Arkiv | Dunderligan</title>
	<meta name="description" content="Se tidigare säsonger av Dunderligan." />

	<meta property="og:description" content="Se tidigare säsonger av Dunderligan." />
</svelte:head>

<PageHeader title="Arkiv"></PageHeader>

<PageSection>
	<Subheading class="mb-4">Säsonger</Subheading>

	<div class="space-y-1 overflow-hidden rounded-lg">
		{#each data.seasons as { id, name, slug, startedAt } (id)}
			<AdminLink href="/stallningar/{slug}">
				<span>{name}</span>
				<span class="ml-2 text-base font-medium">{startedAt.getFullYear()}</span>
			</AdminLink>
		{/each}
	</div>
</PageSection>
