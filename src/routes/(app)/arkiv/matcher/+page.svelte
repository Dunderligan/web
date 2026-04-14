<script lang="ts">
	import { page } from '$app/state';
	import AsyncMatchList from '$lib/components/match/AsyncMatchList.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { MatchState } from '$lib/types.js';

	let { data } = $props();

	const prev = $derived(page.url.searchParams.get('prev'));

	const subtitle = $derived.by(() => {
		let subtitle = 'Visar ';

		const showingAll = !data.roster && !data.division;
		if (showingAll) {
			subtitle += 'samtliga ';
		}

		const states = data.params.state;
		if (states?.includes(MatchState.PLAYED)) {
			subtitle += 'spelade ';
		} else if (states?.includes(MatchState.SCHEDULED)) {
			subtitle += 'planerade ';
		}

		if (data.roster) {
			subtitle += `matcher med ${data.roster.name}`;
		} else if (data.division) {
			subtitle += `matcher i ${data.division.name}, ${data.division.season.name}`;
		} else {
			subtitle += 'matcher';
		}

		subtitle += `.`;

		return subtitle;
	});

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

<PageHeader title="Matcharkiv" {subtitle} />

<PageSection>
	{#if prev}
		<Button kind="secondary" href={prev} icon="ph:arrow-left" label="Tillbaka" />
	{/if}

	<div class="max-w-2xl">
		<div class="mt-6 mb-4 flex items-center justify-between">
			<Button
				disabled={data.params.page === 0}
				class="mr-auto"
				kind="secondary"
				icon="ph:arrow-left"
				label="Föregående sida"
				href={queryParamHref('page', data.params.page - 1)}
				data-sveltekit-noscroll
			/>

			{#await data.query}
				<!-- While waiting for the query, we can't know whether there's a next page or not, 
				so just disable the button. -->
				{@render nextPageButton({ disabled: true })}
			{:then { hasNextPage }}
				{@render nextPageButton({ disabled: !hasNextPage })}
			{/await}
		</div>

		<AsyncMatchList
			matches={data.query.then((res) => res.results)}
			skeletonCount={data.params.pageSize}
			mainRosterId={data.params.rosterId}
		/>
	</div>
</PageSection>

{#snippet nextPageButton({ disabled }: { disabled: boolean })}
	<Button
		kind="secondary"
		icon="ph:arrow-right"
		label="Nästa sida"
		href={queryParamHref('page', data.params.page + 1)}
		{disabled}
		data-sveltekit-noscroll
	/>
{/snippet}
