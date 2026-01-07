<script lang="ts">
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import InputField from '../ui/InputField.svelte';
	import Label from '../ui/Label.svelte';
	import RosterSelect from '../admin/RosterSelect.svelte';
	import DateInput from '../ui/DateInput.svelte';

	const rosterCtx = RosterContext.get();
	const saveCtx = SaveContext.get();

	const match = $derived(rosterCtx.editingMatch);

	let open = $derived(match !== null);

	$effect(() => {
		if (match) {
			match.played = match.teamAScore > 0 || match.teamBScore > 0;
		}
	});
</script>

<Dialog
	{open}
	wide
	title="Redigera match"
	buttons={[
		{
			label: 'Klar',
			icon: 'ph:check',
			onclick: () => rosterCtx.stopMatchEdit()
		}
	]}
	onOpenChange={(state) => {
		if (!state) {
			rosterCtx.stopMatchEdit();
		}
	}}
>
	{#if match}
		<div class="flex gap-2">
			<RosterSelect
				class="w-full"
				bind:selectedId={match.rosterAId}
				disabled={!rosterCtx.canEditRosters}
				onValueChange={saveCtx.setDirty}
				canClear
			/>
			<InputField
				class="w-1/3 min-w-0"
				bind:value={match.teamAScore}
				onchange={saveCtx.setDirty}
				type="number"
				placeholder="Poäng"
			/>
		</div>
		<div class="flex gap-2">
			<RosterSelect
				class="w-full"
				bind:selectedId={match.rosterBId}
				disabled={!rosterCtx.canEditRosters}
				onValueChange={saveCtx.setDirty}
				canClear
			/>
			<InputField
				class="w-1/3 min-w-0"
				bind:value={match.teamBScore}
				onchange={saveCtx.setDirty}
				type="number"
				placeholder="Poäng"
			/>
		</div>
		<div class="mb-6">
			<Label label="Draws">
				<InputField
					bind:value={match.draws}
					onchange={saveCtx.setDirty}
					type="number"
					placeholder="Antal draws"
					class="w-1/3"
				/>
			</Label>
		</div>

		<Label label="Planerad">
			<DateInput bind:value={match.scheduledAt} oninput={saveCtx.setDirty} />
		</Label>
		<Label label="Spelad">
			<DateInput bind:value={match.playedAt} oninput={saveCtx.setDirty} disabled={!match.played} />
		</Label>
		<Label label="VOD">
			<InputField
				bind:value={match.vodUrl}
				onchange={saveCtx.setDirty}
				placeholder="https://youtube.com/..."
			/>
		</Label>
	{/if}
</Dialog>
