<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { queryPlayers } from '$lib/remote/player.remote';
	import Icon from '../ui/Icon.svelte';

	type PlayerOption = {
		id: string;
		battletag: string;
	};

	type Props = {
		value?: string;
		disabled?: boolean;
		onValueChange?: (player: PlayerOption | null) => void;
	};

	let {
		value = $bindable(),
		disabled = false,
		onValueChange
	}: Props = $props();

	let searchQuery = $state('');
	let items: { label: string; value: string }[] = $state([]);
	let players: Map<string, PlayerOption> = $state(new Map());

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
			players = new Map();
			loading = false;
		}
	}

	async function updateItems(searchQuery: string) {
		const results = await queryPlayers({ query: searchQuery });
		players = new Map(results.map((player) => [player.id, player]));
		items = results.map((player) => ({
			label: player.battletag,
			value: player.id
		}));

		loading = false;
	}
</script>

<Combobox.Root
	type="single"
	bind:value
	{items}
	{disabled}
	onValueChange={(playerId) => {
		if (onValueChange) {
			onValueChange(players.get(playerId) ?? null);
		}
	}}
>
	<Combobox.Input
		class="group field flex grow items-center overflow-hidden rounded-lg border border-transparent ring-accent-600 focus:ring-2 focus:outline-none"
		placeholder="Sök efter spelare..."
		oninput={(evt) => (searchQuery = evt.currentTarget.value)}
	></Combobox.Input>

	{#if searchQuery.length >= 2}
		<Combobox.Content class="floating w-(--bits-combobox-anchor-width)">
			{#if loading}
				<div class="py-2 text-center font-medium text-gray-500">
					<Icon icon="ph:spinner" class="animate-spin" />
				</div>
			{:else if items.length === 0}
				<div class="py-2 text-center font-medium text-gray-600 dark:text-gray-300">
					Inga spelare hittades
				</div>
			{:else}
				{#each items as item (item.value)}
					<Combobox.Item value={item.value} class="floating-item my-0.5">
						{item.label}
					</Combobox.Item>
				{/each}
			{/if}
		</Combobox.Content>
	{/if}
</Combobox.Root>
