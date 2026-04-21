<script lang="ts">
	import { page } from '$app/state';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Subheading from '$lib/components/ui/Subheading.svelte';
	import type { ListedSeason } from '$lib/types';

	let { data } = $props();

	const mainSeasons = $derived(data.seasons.filter((s) => !s.spinoff));
	const spinoffSeasons = $derived(data.seasons.filter((s) => s.spinoff));
</script>

<Meta title="Arkiv" description="Se tidigare säsonger av Dunderligan samt matcharkivet." />

<PageHeader title="Arkiv" subtitle="Bläddra genom säsonger av Dunderligan" />

<PageSection>
	{#if mainSeasons.length > 0}
		<Subheading class="mb-4">Ligasäsonger</Subheading>

		{@render seasonList(mainSeasons)}
	{/if}

	{#if spinoffSeasons.length > 0}
		<Subheading class="mt-8 mb-4">Andra turneringar</Subheading>

		{@render seasonList(spinoffSeasons)}
	{/if}

	<div class="mt-10 space-y-1 overflow-hidden rounded-lg">
		<AdminLink href="/arkiv/matcher?prev={page.url.pathname}">Matcher</AdminLink>
	</div>
</PageSection>

{#snippet seasonList(seasons: ListedSeason[])}
	<div class="space-y-1 overflow-hidden rounded-lg">
		{#each seasons as season (season.id)}
			<AdminLink href="/stallningar/{season.slug}">
				<span>{season.name}</span>
				<span class="ml-2 text-base font-medium">{season.startedAt.getFullYear()}</span>
			</AdminLink>
		{/each}
	</div>
{/snippet}
