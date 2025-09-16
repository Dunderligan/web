<script lang="ts">
	import type { Roster } from '$lib/types';

	type Props = {
		selectedId?: string | null;
		rosters: Map<string, Roster>;
	};

	let { selectedId = $bindable(), rosters }: Props = $props();
</script>

<select bind:value={selectedId}>
	<option value={null}>?</option>
	{#each rosters as [id, { name }] (id)}
		<option value={id}>{name}</option>
	{/each}
</select>
