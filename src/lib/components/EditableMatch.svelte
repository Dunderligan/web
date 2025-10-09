<script lang="ts">
	import { RosterState } from '$lib/state/rosters.svelte';
	import type { FullMatch } from '$lib/types';
	import { DropdownMenu } from 'bits-ui';
	import Icon from './Icon.svelte';
	import RosterLogo from './RosterLogo.svelte';

	type Props = {
		match: FullMatch;
		canEditRosters?: boolean;
		canDelete?: boolean;
		ondelete?: () => void;
	};

	let { match, canEditRosters = true, canDelete = true, ondelete }: Props = $props();

	const rosters = RosterState.get();
</script>

<div class="relative flex overflow-hidden rounded-lg bg-gray-100">
	<div>
		{@render side(match.rosterAId, match.teamAScore)}
		{@render side(match.rosterBId, match.teamBScore)}
	</div>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="absolute top-3 right-3 flex size-8 items-center justify-center rounded-md bg-white text-gray-500"
		>
			<Icon icon="mdi:edit" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content
			class="z-20 min-w-40 rounded-lg border border-gray-200 bg-white p-1.5 shadow-md"
		>
			<DropdownMenu.Item
				class="cursor-pointer rounded-md px-4 py-1.5 text-left font-semibold text-gray-600 hover:bg-gray-100"
				onclick={() => rosters.edit(match, canEditRosters)}>Redigera</DropdownMenu.Item
			>
			{#if canDelete}
				<DropdownMenu.Item
					onclick={ondelete}
					class="cursor-pointer rounded-md px-4 py-1.5 text-left font-semibold text-gray-600 hover:bg-gray-100"
					>Radera</DropdownMenu.Item
				>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

{#snippet side(rosterId?: string | null, score?: number | null)}
	{@const roster = rosters.find(rosterId)}

	<div class="flex h-10 items-center text-gray-700">
		<div
			class="mr-2 flex h-full w-10 items-center justify-center font-display text-xl font-extrabold"
		>
			{score}
		</div>

		<!-- {#if roster}
			<RosterLogo id={roster.id} class="mr-2 size-8" />
		{/if} -->

		{#if roster}
			<a href="/admin/roster/{rosterId}" class="font-semibold hover:underline">{roster?.name}</a>
		{:else}
			---
		{/if}
	</div>
{/snippet}
