<script lang="ts">
	import { RosterState } from '$lib/state/rosters.svelte';
	import type { Roster } from '$lib/types';

	type Props = {
		selectedId?: string | null;
	};

	let { selectedId = $bindable() }: Props = $props();

	const rosters = RosterState.get();
</script>

<select bind:value={selectedId}>
	<option value={null}>?</option>
	{#each rosters.map as [id, { name }] (id)}
		<option value={id}>{name}</option>
	{/each}
</select>
