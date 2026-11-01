<script lang="ts">
	import { queryPlayers } from '$lib/remote/player.remote';
	import SearchSelect from '../form/SearchSelect.svelte';
	import type { SelectItem } from '$lib/types';
	import type { ComponentProps } from 'svelte';

	type Props = Omit<ComponentProps<typeof SearchSelect>, 'queryItems'>;

	let {
		value = $bindable(),
		placeholder = 'Sök efter spelare...',
		noResultsText = 'Inga spelare hittades',
		...props
	}: Props = $props();

	async function queryItems(query: string): Promise<SelectItem[]> {
		const results = await queryPlayers({ query });

		return results.map((player) => ({
			label: player.battletag,
			value: player.id
		}));
	}
</script>

<SearchSelect bind:value {queryItems} {placeholder} {noResultsText} {...props} />
