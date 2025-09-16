<script lang="ts">
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import type { Match } from '$lib/types';
	import { getRoster } from '$lib/util';
	import { deleteBracket, generateBracket, updateBracket } from './page.remote';

	const { data } = $props();

	const { season, division, group, matches, rosters } = $derived(data);

	let editingMatch: Match | null = $state(null);

	let rounds: Match[][] = $state(buildRounds());

	function buildRounds() {
		const finalMatch = matches.values().find((match) => !match.nextMatchId);

		if (!finalMatch) {
			console.warn('No final match found!');
			return [];
		}

		const rounds: Match[][] = [];
		let currentRound = [finalMatch];

		while (currentRound.length > 0) {
			rounds.unshift(currentRound);

			const nextRoundIds = new Set(currentRound.map((match) => match.id));
			const prevRound = matches
				.values()
				.filter((match) => match.nextMatchId && nextRoundIds.has(match.nextMatchId))
				.toArray();

			currentRound = prevRound;
		}

		return rounds;
	}

	async function generate() {
		const result = await generateBracket({
			groupId: group.id
		});

		rounds = result.rounds;
	}

	async function save() {
		await updateBracket({
			matches: matches.values().toArray()
		});
	}

	async function deleteCurrent() {
		await deleteBracket({
			groupId: group.id
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
						{@const rosterA = getRoster(match.rosterAId, rosters)}
						{@const rosterB = getRoster(match.rosterBId, rosters)}

						<div class="flex">
							<div>
								<div>
									{#if rosterA}
										<a href="/admin/roster/{match.rosterAId}">{rosterA.name}</a>
									{:else}
										---
									{/if}

									{match.teamAScore}
								</div>
								<div>
									{#if rosterB}
										<a href="/admin/roster/{match.rosterBId}">{rosterB.name}</a>
									{:else}
										---
									{/if}

									{match.teamBScore}
								</div>
							</div>

							<button onclick={() => (editingMatch = match)}>R</button>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<button onclick={deleteCurrent}> Radera </button>
		<button onclick={save}> Spara </button>
	{:else}
		<div>
			Denna grupp har inget bracket.
			<button onclick={generate}>Generera</button>
		</div>
	{/if}
</div>

<EditMatchDialog {rosters} bind:match={editingMatch} />
