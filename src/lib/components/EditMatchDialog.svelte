<script lang="ts">
	import type { Match, Roster } from '$lib/types';
	import { getRoster } from '$lib/util';
	import Dialog from './Dialog.svelte';
	import RosterSelect from './RosterSelect.svelte';

	type Props = {
		match: Match | null;
		rosters: Map<string, Roster>;
	};

	let { match = $bindable(), rosters }: Props = $props();

	let open = $derived(match !== null);
</script>

<Dialog
	title="Redigera match"
	{open}
	onOpenChange={(state) => {
		if (!state) {
			match = null;
		}
	}}
>
	{#if match}
		<div class="flex">
			<RosterSelect bind:selectedId={match.rosterAId} {rosters} />
			<input class="min-w-0 grow" bind:value={match.teamAScore} type="number" min="0" max="3" />
		</div>
		<div class="flex">
			<RosterSelect bind:selectedId={match.rosterBId} {rosters} />
			<input class="min-w-0 grow" bind:value={match.teamBScore} type="number" min="0" max="3" />
		</div>
	{/if}
</Dialog>
