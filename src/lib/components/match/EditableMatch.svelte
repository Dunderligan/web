<script lang="ts">
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte';
	import type { FullMatchWithoutOrder } from '$lib/types';
	import Button from '../ui/Button.svelte';

	type Props = {
		match: FullMatchWithoutOrder;
		canEditRosters?: boolean;
		canDelete?: boolean;
		ondelete?: () => void;
	};

	let { match, canEditRosters = true, canDelete = true, ondelete }: Props = $props();

	const rosterCtx = RosterContext.get();
</script>

<div class="relative flex overflow-hidden rounded-lg bg-gray-100">
	<div>
		{@render side(match.rosterAId, match.teamAScore)}
		{@render side(match.rosterBId, match.teamBScore)}
	</div>

	<div class="absolute top-3 right-3 flex items-center">
		<Button
			icon="mdi:edit"
			kind="tertiary"
			onclick={() => rosterCtx.editMatch(match, canEditRosters)}
			title="Redigera"
		/>

		{#if canDelete}
			<Button icon="mdi:trash" kind="tertiary" onclick={ondelete} title="Radera" />
		{/if}
	</div>
</div>

{#snippet side(rosterId?: string | null, score?: number | null)}
	{@const roster = rosterCtx.find(rosterId)}

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
