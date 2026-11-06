<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { generateBracket } from '$lib/remote/bracket.remote';
	import { BracketFormat } from '$lib/types';
	import Checkbox from '../form/Checkbox.svelte';
	import InputField from '../form/InputField.svelte';
	import Label from '../form/Label.svelte';
	import Note from '../ui/Note.svelte';
	import Select from '../form/Select.svelte';
	import CreateDialog from './CreateDialog.svelte';

	type Props = {
		open: boolean;
		divisionName: string;
		divisionId: string;
	};

	let { open = $bindable(), divisionId, divisionName }: Props = $props();

	let name = $derived(divisionName);
	let roundCount = $state(2);
	let avoidPreviousMatchups = $state(true);
	let flipStandings = $state(false);
	let doubleElimination = $state(false);

	async function submit() {
		const { bracket } = await generateBracket({
			name,
			divisionId,
			roundCount: roundCount,
			avoidPreviousMatchups,
			flipStandings,
			format: doubleElimination
				? BracketFormat.DOUBLE_ELIMINATION
				: BracketFormat.SINGLE_ELIMINATION
		});

		open = false;
		await goto(resolve(`/admin/bracket/${bracket.id}`));
	}
</script>

<CreateDialog wide title="Skapa bracket" bind:open oncreate={submit} disabled={!roundCount}>
	<Label label="Namn">
		<Note
			content="Bracketnamnet används för att särskilja olika brackets i samma division."
			class="mr-2"
		/>

		<InputField bind:value={name} placeholder="T.ex. Dunderligan" />
	</Label>

	<Label label="Storlek">
		<Select
			class="grow"
			type="single"
			bind:value={() => roundCount.toString(), (v: string) => (roundCount = parseInt(v))}
			items={[1, 2, 3, 4, 5].map((n) => ({
				label: `${n} ${n === 1 ? 'runda' : 'rundor'} (${Math.pow(2, n)} platser${doubleElimination ? ' i övre bracket' : ''})`,
				value: n.toString()
			}))}
		/>
	</Label>

	<Label label="Dubbel eliminering">
		<Checkbox bind:checked={doubleElimination} />
	</Label>

	<Label label="Undvik tidigare möten">
		<Checkbox bind:checked={avoidPreviousMatchups} />
	</Label>

	<Label label="Invertera seeding">
		<Checkbox bind:checked={flipStandings} />
	</Label>
</CreateDialog>
