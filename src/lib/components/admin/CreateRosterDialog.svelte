<script lang="ts">
	import Checkbox from '../ui/Checkbox.svelte';
	import InputField from '../ui/InputField.svelte';
	import Label from '../ui/Label.svelte';
	import CreateDialog from './CreateDialog.svelte';
	import TeamSelect from './TeamSelect.svelte';

	type Props = {
		open: boolean;
		excludeSeasonId: string;
		onsubmit: (name: string, teamId?: string) => Promise<void>;
	};

	let { open = $bindable(false), excludeSeasonId, onsubmit }: Props = $props();

	let name = $state('');

	let hasExistingTeam = $state(false);
	let teamId: string | undefined = $state();

	async function submit() {
		await onsubmit(name, hasExistingTeam ? teamId : undefined);
	}
</script>

<CreateDialog
	title="Skapa roster"
	bind:open
	oncreate={submit}
	onclose={() => {
		teamId = undefined;
		name = '';
	}}
	disabled={!name.trim() || (hasExistingTeam && !teamId)}
>
	<Label label="Tillhör existerande lag">
		<Checkbox bind:checked={hasExistingTeam} />
	</Label>

	<Label label="Länkat lag">
		<TeamSelect
			bind:value={teamId}
			{excludeSeasonId}
			disabled={!hasExistingTeam}
			onValueChange={(_, rosters) => {
				if (rosters) {
					name = rosters[0].name;
				}
			}}
		/>
	</Label>

	<Label label="Namn">
		<InputField bind:value={name} placeholder="T.ex. Groot Gaming..." onenter={submit} />
	</Label>
</CreateDialog>
