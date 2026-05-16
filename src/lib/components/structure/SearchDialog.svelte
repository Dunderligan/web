<script lang="ts">
	import type { RemoteQuery } from '@sveltejs/kit';
	import Dialog from '../ui/Dialog.svelte';
	import InputField from '../ui/InputField.svelte';
	import type { SearchItem } from '$lib/types';
	import SearchItemLink from '../admin/SearchItemLink.svelte';
	import Placeholder from '../ui/Placeholder.svelte';
	import { search } from '$lib/remote/search.remote';
	import { goto } from '$app/navigation';

	type Props = {
		open?: boolean;
	};

	let query = $state('');
	let loading = $state(false);
	let remoteQuery: RemoteQuery<{ results: SearchItem[] }> | null = $state(null);

	let debounceTimeout: NodeJS.Timeout | null = null;

	let { open = $bindable(false) }: Props = $props();

	function oninput() {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		if (query.length < 3) {
			remoteQuery = null;
			loading = false;
			return;
		}

		loading = true;

		debounceTimeout = setTimeout(() => {
			remoteQuery = search({ query });
			remoteQuery.finally(() => {
				loading = false;
			});
		}, 300);
	}

	async function onenter() {
		if (!remoteQuery?.current) return;
		const values = remoteQuery.current.results;
		if (values.length === 0) return;

		await goto(values[0].href);
		reset();
		open = false;
	}

	function reset() {
		query = '';
		remoteQuery = null;
	}
</script>

<Dialog
	bind:open
	title="Sök hela webbplatsen"
	position="top"
	wide
	onOpenChange={(value) => {
		if (!value) {
			reset();
		}
	}}
>
	<InputField
		class="w-full"
		bind:value={query}
		placeholder="Sök efter spelare, lag eller säsonger..."
		{onenter}
		{oninput}
	/>

	<div
		class="max-h-[calc(100lvh-230px)] space-y-1 overflow-y-auto rounded-lg sm:max-h-[calc(75lvh-160px)]"
	>
		{#if loading}
			{@render skeleton()}
		{:else if remoteQuery}
			{#await remoteQuery then { results }}
				{#if results.length === 0}
					<Placeholder icon="ph:magnifying-glass" text="Inga resultat hittades" />
				{:else}
					{#each results as result (result.id)}
						<SearchItemLink
							item={result}
							onclick={() => {
								open = false;
								reset();
							}}
						/>
					{/each}
				{/if}
			{/await}
		{/if}
	</div>

	{#if !loading && !remoteQuery}
		<div class="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
			Tips: Tryck Ctrl + K för att växla sökfältet.
		</div>
	{/if}
</Dialog>

{#snippet skeleton()}
	{#each Array.from({ length: 3 })}
		<div class="h-18 animate-pulse bg-gray-100 dark:bg-gray-800"></div>
	{/each}
{/snippet}
