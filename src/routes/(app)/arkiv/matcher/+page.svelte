<script lang="ts">
	import { page } from '$app/state';
	import MatchList from '$lib/components/match/MatchList.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { queryMatches } from '$lib/remote/match.remote.js';

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
</script>

<Meta title="Matcharkiv" description="Bläddra genom Dunderligans matcharkiv." />

<PageHeader title="Matcharkiv"></PageHeader>

<PageSection>
	{#if prev}
		<Button kind="secondary" href={prev} icon="ph:arrow-left" label="Tillbaka" />
	{/if}

	<div class="max-w-2xl grow space-y-2">
		<div class="mt-6 mb-4 flex items-center">
			<Button
				disabled={data.query.page === 0}
				class="mr-auto"
				kind="secondary"
				icon="ph:arrow-left"
				label="Föregående sida"
				href={queryParamHref('sida', data.query.page - 1)}
				data-sveltekit-noscroll
			/>

			{#await matchQuery}
				<!-- While waiting for the query, we can't know whether there's a next page or not, 
				so just disable the button. -->
				{@render nextPageButton({ disabled: true })}
			{:then { hasNextPage }}
				{@render nextPageButton({ disabled: !hasNextPage })}
			{/await}
		</div>

		<MatchList
			matches={matchQuery.then((res) => res.matches)}
			skeletonCount={data.pageSize}
			mainRosterId={data.query.rosterId}
		/>
	</div>
</PageSection>

{#snippet nextPageButton({ disabled }: { disabled: boolean })}
	<Button
		class="ml-auto"
		kind="secondary"
		icon="ph:arrow-right"
		label="Nästa sida"
		href={queryParamHref('sida', data.query.page + 1)}
		{disabled}
		data-sveltekit-noscroll
	/>
{/snippet}
