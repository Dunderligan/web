<script lang="ts">
	import { page } from '$app/state';
	import MatchList from '$lib/components/match/MatchList.svelte';
	import Meta from '$lib/components/structure/Meta.svelte';
	import PageHeader from '$lib/components/structure/PageHeader.svelte';
	import PageSection from '$lib/components/structure/PageSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();

	const prev = $derived(page.url.searchParams.get('prev'));

	const subtitle = $derived.by(() => {
		if (data.roster) {
			return `Visar matcher för ${data.roster.name}`;
		} else if (data.division) {
			return `Visar matcher i ${data.division.name}, ${data.division.season.name}`;
		} else {
			return 'Visar samtliga matcher';
		}
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
				href={queryParamHref('sida', data.params.page - 1)}
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

		<MatchList
			matches={data.query.then((res) => res.results)}
			skeletonCount={data.pageSize}
			mainRosterId={data.params.rosterId}
		/>
	</div>
</PageSection>

{#snippet nextPageButton({ disabled }: { disabled: boolean })}
	<Button
		kind="secondary"
		icon="ph:arrow-right"
		label="Nästa sida"
		href={queryParamHref('sida', data.params.page + 1)}
		{disabled}
		data-sveltekit-noscroll
	/>
{/snippet}
