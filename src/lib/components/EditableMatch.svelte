<script lang="ts">
	import { RosterState } from '$lib/state/rosters.svelte';
	import type { Match, Roster } from '$lib/types';
	import { DropdownMenu } from 'bits-ui';

	type Props = {
		match: Match;
		ondelete?: () => void;
	};

	let { match, ondelete }: Props = $props();

	const rosters = RosterState.get();
</script>

<div class="flex">
	<div>
		{@render side(match.rosterAId, match.teamAScore)}
		{@render side(match.rosterBId, match.teamBScore)}
	</div>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>:</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Item onclick={() => rosters.edit(match)}>Redigera</DropdownMenu.Item>
			<DropdownMenu.Item onclick={ondelete}>Radera</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

{#snippet side(rosterId?: string | null, score?: number | null)}
	{@const roster = rosters.find(rosterId)}

	<div>
		{#if roster}
			<a href="/admin/roster/{rosterId}">{roster?.name}</a>
		{:else}
			---
		{/if}

		{score}
	</div>
{/snippet}
