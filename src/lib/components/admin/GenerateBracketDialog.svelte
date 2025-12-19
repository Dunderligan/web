<script lang="ts">
	import { generateBracket } from '$lib/remote/division.remote';
	import { getDivisionsBySeason } from '$lib/remote/season.remote';
	import type { FullMatch } from '$lib/types';
	import Checkbox from '../ui/Checkbox.svelte';
	import Label from '../ui/Label.svelte';
	import Select from '../ui/Select.svelte';
	import CreateDialog from './CreateDialog.svelte';

	type Props = {
		open: boolean;
		seasonId: string;
		divisionId: string;
		onGenerated?: (rounds: FullMatch[][]) => void;
	};

	let { open = $bindable(), seasonId, divisionId, onGenerated }: Props = $props();

	let rosterDivisionId = $state(divisionId);
	let roundCount = $state(2);
	let avoidPreviousMatches = $state(true);
	let flipStandings = $state(false);

	async function submit() {
		const result = await generateBracket({
			divisionId,
			rosterDivisionId,
			roundCount: roundCount,
			avoidPreviousMatches,
			flipStandings
		});

		open = false;
		onGenerated?.(result.rounds);
	}
</script>

<CreateDialog wide title="Generera bracket" bind:open oncreate={submit} disabled={!roundCount}>
	<Label label="Division för lag">
		{#await getDivisionsBySeason({ seasonId }) then { divisions }}
			<Select
				class="grow"
				type="single"
				bind:value={rosterDivisionId}
				items={divisions.map((division) => ({
					label: division.name,
					value: division.id
				}))}
			/>
		{/await}
	</Label>

	<Label label="Storlek">
		<Select
			class="grow"
			type="single"
			bind:value={() => roundCount.toString(), (v: string) => (roundCount = parseInt(v))}
			items={[2, 3, 4].map((n) => ({
				label: `${n} rundor (${Math.pow(2, n)} platser)`,
				value: n.toString()
			}))}
		/>
	</Label>

	<Label label="Undvik tidigare möten">
		<Checkbox bind:checked={avoidPreviousMatches} />
	</Label>

	<Label label="Invertera seeding">
		<Checkbox bind:checked={flipStandings} />
	</Label>
</CreateDialog>
