<script lang="ts">
	import type { RemoteQuery } from '@sveltejs/kit';
	import Dialog from '../ui/Dialog.svelte';
	import InputField from '../ui/InputField.svelte';
	import type { SearchItem } from '$lib/types';
	import SearchItemLink from '../admin/SearchItemLink.svelte';
	import Placeholder from '../ui/Placeholder.svelte';
	import { search } from '$lib/remote/search.remote';

	type Props = {
		open?: boolean;
	};

	let query = $state('');
	let remoteQuery: RemoteQuery<{ results: SearchItem[] }> | null = $state(null);

	let debounceTimeout: NodeJS.Timeout | null = null;

	let { open = $bindable(false) }: Props = $props();

	function oninput() {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		if (query.length < 3) {
			remoteQuery = null;
			return;
		}

		debounceTimeout = setTimeout(() => {
			remoteQuery = search({ query });
		}, 200);
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
		placeholder="Sök efter spelare, lag, säsonger eller sidor..."
		{oninput}
	/>

	<div class="space-y-1 overflow-hidden rounded-lg">
		{#if remoteQuery}
			{#await remoteQuery}
				{@render skeleton()}
			{:then { results }}
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
		{:else if query.length >= 3}
			{@render skeleton()}
		{/if}
	</div>
</Dialog>

{#snippet skeleton()}
	{#each Array.from({ length: 3 })}
		<div class="h-18 animate-pulse bg-gray-100 dark:bg-gray-700"></div>
	{/each}
{/snippet}
