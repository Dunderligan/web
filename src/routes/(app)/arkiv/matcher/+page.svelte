<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Match from '$lib/components/match/Match.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { queryMatches } from '$lib/remote/match.remote.js';
	import { flattenGroup } from '$lib/util';

	let { data } = $props();

	const matchQuery = $derived(queryMatches(data.query));
	const prev = $derived(page.url.searchParams.get('prev'));

	function queryParamHref(param: string, value: any) {
		const url = new URL(page.url);
		if (value === null || value === undefined) {
			url.searchParams.delete(param);
		} else {
			url.searchParams.set(param, value);
		}
		return url.href;
	}

	async function setQueryParam(param: string, value: any) {
		const url = queryParamHref(param, value);
		await goto(url);
	}
</script>

<PageHeader title="Matcharkiv"></PageHeader>

<PageSection>
	{#if prev}
		<Button kind="secondary" href={prev} icon="ph:arrow-left" label="Tillbaka" />
	{/if}

	<div class="max-w-2xl grow space-y-1">
		<div class="mt-6 mb-4 flex items-center">
			<Button
				disabled={data.query.page === 0}
				class="mr-auto"
				kind="secondary"
				icon="ph:arrow-left"
				label="Föregående sida"
				href={queryParamHref('sida', data.query.page - 1)}
			/>

			<Button
				class="ml-auto"
				kind="secondary"
				href={queryParamHref('sida', data.query.page + 1)}
				icon="ph:arrow-right"
				label="Nästa sida"
			/>
		</div>

		{#await matchQuery}
			{#each Array.from({ length: data.pageSize })}
				<div class="h-[136px] animate-pulse rounded-lg bg-gray-100 sm:h-[96px]"></div>
			{/each}
		{:then results}
			{#each results.matches.slice(0, data.pageSize) as { group, division, ...match } (match.id)}
				{@const season = group ? flattenGroup(group).season : division?.season}

				<Match seasonSlug={season!.slug} {match} />
			{:else}
				<div class="text-center py-10 text-gray-700 space-y-2 bg-gray-100 rounded-lg">
					<Icon icon="ph:ghost" class="text-5xl block mx-auto" />
					<span class="text-xl font-semibold">Inga matcher hittades</span>
				</div>
			{/each}
		{/await}
	</div>
</PageSection>
