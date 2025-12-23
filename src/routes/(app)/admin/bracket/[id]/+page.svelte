<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EditableMatch from '$lib/components/match/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/match/EditMatchDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import type { FullMatch } from '$lib/types';
	import { buildBracketRounds } from '$lib/bracket.js';
	import { deleteBracket, updateBracket } from '$lib/remote/bracket.remote';

	const { data } = $props();

	const bracket = $state(data.bracket);
	const division = $state(data.division);
	const season = $state(division.season);

	RosterContext.set(new RosterContext(data.rosters));
	SaveContext.set(
		new SaveContext({
			save,
			href: `/stallningar/${season.slug}?div=${division.slug}&visa=slutspel`
		})
	);

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	let rounds: FullMatch[][] = $state([]);

	async function onDeleteClicked() {
		await confirmCtx.confirm({
			title: 'Radera bracket',
			description: `Är du säker på att du vill radera bracket ${bracket.name ?? division.name}, ${season.name}?`,
			negative: true,
			action: async () => {
				await deleteBracket({
					id: bracket.id
				});

				await goto(`/admin/division/${division.id}`);
			}
		});
	}

	async function save() {
		await updateBracket({
			id: bracket.id,
			name: bracket.name,
			matches: bracket.matches
		});
	}

	$effect(() => {
		rounds = buildBracketRounds(bracket.matches);
	});

	$effect(() => {
		for (let i = 0; i < rounds.length - 1; i++) {
			for (let j = 0; j < rounds[i].length; j++) {
				const match = rounds[i][j];
				if (!match.rosterAId || !match.rosterBId) continue;

				const nextMatch = rounds[i + 1][Math.floor(j / 2)];
				const isRosterAInNext = j % 2 == 0;

				const winner = match.played
					? (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
						? match.rosterAId
						: match.rosterBId
					: null;

				if (isRosterAInNext) {
					nextMatch.rosterAId = winner;
				} else if (!isRosterAInNext) {
					nextMatch.rosterBId = winner;
				}
			}
		}
	});
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: bracket.name ?? 'Bracket', href: `/admin/bracket/${bracket.id}` }
	]}
/>

<AdminCard title="Bracket">
	<div class="flex w-full items-stretch gap-4">
		{#each rounds as round, i}
			<div class="flex w-full flex-col justify-around gap-4">
				{#each round as match (match.id)}
					<EditableMatch {match} canDelete={false} canEditRosters={i === 0} />
				{/each}
			</div>
		{/each}
	</div>
</AdminCard>

<AdminCard title="Inställningar">
	<div class="space-y-2">
		<Label label="Namn">
			<InputField bind:value={bracket.name} oninput={saveCtx.setDirty} />
		</Label>
	</div>

	<Button icon="ph:trash" label="Radera bracket" kind="negative" onclick={onDeleteClicked} />
</AdminCard>

<EditMatchDialog />

<SaveToast />
