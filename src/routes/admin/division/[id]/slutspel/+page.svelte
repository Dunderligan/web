<script lang="ts">
	import EditableMatch from '$lib/components/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import { RosterState } from '$lib/state/rosters.svelte';
	import type { FullMatch } from '$lib/types';
	import { buildBracket } from '$lib/util';
	import { deleteBracket, generateBracket, updateBracket } from './page.remote';

	const { data } = $props();

	const { division, matches } = $derived(data);

	RosterState.set(new RosterState(data.rosters));

	let rounds: FullMatch[][] = $state(buildBracket(matches));

	async function generate() {
		const result = await generateBracket({
			divisionId: division.id
		});

		rounds = result.rounds;
	}

	async function save() {
		await updateBracket({
			matches: rounds.flatMap((round) => round)
		});
	}

	async function deleteCurrent() {
		await deleteBracket({
			divisionId: division.id
		});

		rounds = [];
	}
</script>

<div class="space-y-6">
	{#if rounds.length > 0}
		<div class="flex w-full items-stretch gap-4">
			{#each rounds as round}
				<div class="flex w-full flex-col justify-around gap-4">
					{#each round as match}
						<EditableMatch {match} />
					{/each}
				</div>
			{/each}
		</div>

		<button onclick={deleteCurrent}> Radera </button>
		<button onclick={save}> Spara </button>
	{:else}
		<div>
			Denna division har inget bracket.
			<button onclick={generate}>Generera</button>
		</div>
	{/if}
</div>

<EditMatchDialog />
