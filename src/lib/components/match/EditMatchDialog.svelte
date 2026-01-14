<script lang="ts">
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import InputField from '../ui/InputField.svelte';
	import Label from '../ui/Label.svelte';
	import RosterSelect from '../admin/RosterSelect.svelte';
	import DateInput from '../ui/DateInput.svelte';
	import { Accordion } from 'bits-ui';
	import Icon from '../ui/Icon.svelte';
	import { MatchState } from '$lib/types';
	import Select from '../ui/Select.svelte';

	const rosterCtx = RosterContext.get();
	const saveCtx = SaveContext.get();

	const match = $derived(rosterCtx.editingMatch);

	let open = $derived(match !== null);

	const specialState = $derived(
		match?.state === MatchState.WALKOVER || match?.state === MatchState.CANCELLED
			? match.state
			: null
	);

	const hasAdvancedSetting = $derived(
		match && (match.teamANote || match.teamBNote || match.draws > 0 || match.vodUrl || specialState)
	);

	const canEditScores = $derived(match?.state !== MatchState.CANCELLED);

	function getDefaultState() {
		if (!match) return MatchState.SCHEDULED;

		const played = match.teamAScore > 0 || match.teamBScore > 0 || match.draws > 0;
		return played ? MatchState.PLAYED : MatchState.SCHEDULED;
	}
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
				disabled={!canEditScores}
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
				disabled={!canEditScores}
			/>
		</div>

		<Label label="Planerad">
			<DateInput
				bind:value={match.scheduledAt}
				oninput={saveCtx.setDirty}
				disabled={match.state !== MatchState.SCHEDULED}
			/>
		</Label>
		<Label label="Spelad">
			<DateInput
				bind:value={match.playedAt}
				oninput={saveCtx.setDirty}
				disabled={match.state !== MatchState.PLAYED}
			/>
		</Label>

		<Accordion.Root type="single">
			<Accordion.Item class="w-full">
				<Accordion.Trigger
					class="flex w-full items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-left font-medium text-gray-800 hover:bg-gray-200 data-[state=open]:rounded-b-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<Icon icon="ph:gear-six" class="inline-block" />
					Fler inställningar

					{#if hasAdvancedSetting}
						<Icon icon="ph:circle-fill" class="ml-auto text-accent-600" />
					{/if}
				</Accordion.Trigger>
				<Accordion.Content
					class="space-y-2 rounded-b-md border-x-2 border-b-2 border-gray-100 px-6 py-4 dark:border-gray-800"
				>
					<Label label="Status">
						<Select
							type="single"
							class="grow"
							items={[
								{ label: 'Walkover', value: MatchState.WALKOVER },
								{ label: 'Inställd', value: MatchState.CANCELLED }
							]}
							placeholder="Ingen"
							bind:value={
								() => specialState?.toString(),
								(v) => (match.state = (v as MatchState) ?? getDefaultState())
							}
							onValueChange={saveCtx.setDirty}
							canClear
						/>
					</Label>

					<Label label="Draws">
						<InputField
							bind:value={match.draws}
							onchange={saveCtx.setDirty}
							type="number"
							placeholder="Antal draws"
							class="w-1/3"
						/>
					</Label>

					<Label label="VOD">
						<InputField
							bind:value={match.vodUrl}
							onchange={saveCtx.setDirty}
							placeholder="https://youtube.com/..."
						/>
					</Label>

					<Label label="Anteckningar lag A">
						<InputField
							bind:value={match.teamANote}
							onchange={saveCtx.setDirty}
							placeholder="..."
							class="mt-2"
						/>
					</Label>

					<Label label="Anteckningar lag B">
						<InputField
							bind:value={match.teamBNote}
							onchange={saveCtx.setDirty}
							placeholder="..."
						/>
					</Label>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/if}
</Dialog>
