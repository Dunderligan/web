<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateBracket } from '$lib/remote/bracket.remote';
	import Checkbox from '../ui/Checkbox.svelte';
	import InputField from '../ui/InputField.svelte';
	import Label from '../ui/Label.svelte';
	import Select from '../ui/Select.svelte';
	import CreateDialog from './CreateDialog.svelte';

	type Props = {
		open: boolean;
		divisionId: string;
	};

	let { open = $bindable(), divisionId }: Props = $props();

	let name = $state('');
	let roundCount = $state(2);
	let avoidPreviousMatches = $state(true);
	let flipStandings = $state(false);

	async function submit() {
		const { bracket } = await generateBracket({
			name,
			divisionId,
			roundCount: roundCount,
			avoidPreviousMatches,
			flipStandings
		});

		open = false;
		await goto(`/admin/bracket/${bracket.id}`);
	}
</script>

<CreateDialog wide title="Skapa bracket" bind:open oncreate={submit} disabled={!roundCount}>
	<Label label="Namn">
		<InputField bind:value={name} placeholder="T.ex. Dunderligan" />
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
