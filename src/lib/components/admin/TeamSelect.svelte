<script lang="ts">
	import { queryTeams } from '$lib/common.remote';
	import type { RosterWithGroup } from '$lib/types';
	import { Combobox } from 'bits-ui';
	import RosterLogo from '../ui/RosterLogo.svelte';

	type Props = {
		value?: string;
		excludeGroupId?: string;
	};

	let { value = $bindable(), excludeGroupId }: Props = $props();

	let searchQuery = $state('');
	let items: { label: string; value: string }[] = $state([]);
	let teams: Map<string, RosterWithGroup[]> = $state(new Map());

	let loading = $state(false);
	let queryTimer: NodeJS.Timeout | null = null;

	$effect(() => {
		onTyped(searchQuery);
	});

	async function onTyped(searchQuery: string) {
		if (queryTimer) {
			clearTimeout(queryTimer);
		}

		if (searchQuery.length >= 2) {
			loading = true;

			queryTimer = setTimeout(() => {
				updateItems(searchQuery);
			}, 300);
		} else {
			items = [];
			teams = new Map();
			loading = false;
		}
	}

	async function updateItems(searchQuery: string) {
		const results = await queryTeams({ query: searchQuery, excludeGroupId });
		teams = results;
		items = results
			.entries()
			.map(([teamId, rosters]) => ({
				label: rosters.length > 0 ? rosters[0].name : 'Okänt lag',
				value: teamId
			}))
			.toArray();

		loading = false;
	}
</script>

<Combobox.Root type="single" {items} bind:value>
	<Combobox.Input
		class="group flex grow items-center overflow-hidden rounded-lg border border-transparent bg-gray-100 py-2 pr-2 pl-4 font-medium text-gray-800 ring-accent-600 transition-all duration-75 focus:ring-2 focus:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:bg-gray-200 data-[disabled]:text-gray-500"
		placeholder="Välj lag..."
		oninput={(evt) => (searchQuery = evt.currentTarget.value)}
	></Combobox.Input>
	{#if searchQuery.length >= 2}
		<Combobox.Content
			class="z-50 max-h-96 w-[var(--bits-combobox-anchor-width)] min-w-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-md"
		>
			{#if loading}
				<div class="py-2 text-center font-medium text-gray-400">Laddar...</div>
			{:else if teams.size === 0}
				<div class="py-2 text-center font-medium text-gray-600">Inga lag hittades</div>
			{:else}
				{#each teams as [teamId, rosters] (teamId)}
					<Combobox.Item
						value={teamId}
						class={[
							'cursor-pointer items-center space-y-2 rounded-md px-4 py-1.5 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-600 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-600'
						]}
					>
						{#each rosters as roster (roster.id)}
							<div class="flex items-center">
								<RosterLogo id={roster.id} class="mr-3 size-8" />
								<div>
									<div>
										{roster.name}
									</div>
									<div class="text-sm">
										{roster.group.division.season.name}
									</div>
								</div>
							</div>
						{/each}
					</Combobox.Item>
				{/each}
			{/if}
		</Combobox.Content>
	{/if}
</Combobox.Root>
