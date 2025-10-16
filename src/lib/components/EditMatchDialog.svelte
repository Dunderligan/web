<script lang="ts">
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import Dialog from './Dialog.svelte';
	import InputField from './InputField.svelte';
	import Label from './Label.svelte';
	import RosterSelect from './RosterSelect.svelte';

	const rosterCtx = RosterContext.get();
	const saveCtx = SaveContext.get();

	const match = $derived(rosterCtx.editingMatch);

	let open = $derived(match !== null);

	$effect(() => {
		if (!match) return;
		match.played = match.teamAScore !== null || match.teamBScore !== null || match.draws !== null;
	});
</script>

<Dialog
	title="Redigera match"
	{open}
	onOpenChange={(state) => {
		if (!state) {
			rosterCtx.stopEditing();
		}
	}}
>
	{#if match}
		<div class="flex gap-2">
			<RosterSelect
				bind:selectedId={match.rosterAId}
				disabled={!rosterCtx.canEditRosters}
				onValueChange={saveCtx.setDirty}
			/>
			<InputField
				class="w-1/4 min-w-0"
				bind:value={match.teamAScore}
				oninput={saveCtx.setDirty}
				type="number"
				placeholder="Poäng"
			/>
		</div>
		<div class="flex gap-2">
			<RosterSelect
				bind:selectedId={match.rosterBId}
				disabled={!rosterCtx.canEditRosters}
				onValueChange={saveCtx.setDirty}
			/>
			<InputField
				class="w-1/4 min-w-0"
				bind:value={match.teamBScore}
				oninput={saveCtx.setDirty}
				type="number"
				placeholder="Poäng"
			/>
		</div>

		<div class="mt-4 space-y-1">
			<Label label="VOD">
				<InputField bind:value={match.vodUrl} placeholder="https://youtube.com/..." />
			</Label>
		</div>
	{/if}
</Dialog>
