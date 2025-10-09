<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/AdminCard.svelte';
	import AdminLink from '$lib/components/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Button from '$lib/components/Button.svelte';
	import EditableMatch from '$lib/components/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/EditMatchDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { RosterState } from '$lib/state/rosters.svelte';
	import type { FullMatch } from '$lib/types';
	import { buildBracket } from '$lib/util';
	import {
		createGroup,
		deleteBracket,
		deleteDivision,
		generateBracket,
		updateBracket
	} from './page.remote';

	const { data } = $props();

	const { division } = $derived(data);
	const { season } = $derived(division);

	RosterState.set(new RosterState(data.division.groups.flatMap((group) => group.rosters)));

	let createDialogOpen = $state(false);
	let newGroupName = $state('');

	async function onDeleteDivision() {
		await deleteDivision({
			id: division.id
		});

		await goto(`/admin/sasong/${season.id}`);
	}

	async function submitGroup() {
		const { group } = await createGroup({
			name: newGroupName,
			divisionId: division.id
		});

		division.groups.push({ rosters: [], ...group });
		createDialogOpen = false;
		newGroupName = '';
	}

	let rounds: FullMatch[][] = $state(buildBracket(data.matches));

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

	async function onDeleteBracket() {
		await deleteBracket({
			divisionId: division.id
		});

		rounds = [];
	}

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
		{ label: division.name, href: `/admin/division/${division.id}` }
	]}
/>

<AdminCard title="Grupper">
	<div class="space-y-1 overflow-hidden rounded-lg">
		{#each division.groups as { id, name } (id)}
			<AdminLink href="/admin/grupp/{id}">
				{name}
			</AdminLink>
		{/each}
	</div>
</AdminCard>

<AdminCard title="Slutspel">
	{#if rounds.length > 0}
		<div class="flex w-full items-stretch gap-4">
			{#each rounds as round, i}
				<div class="flex w-full flex-col justify-around gap-4">
					{#each round as match}
						<EditableMatch {match} canDelete={false} canEditRosters={i === 0} />
					{/each}
				</div>
			{/each}
		</div>

		<Button icon="mdi:trash-can" label="Radera bracket" kind="negative" onclick={onDeleteBracket} />
	{:else}
		<div
			class="flex items-center gap-2 rounded-lg bg-accent-50 py-2 pr-3 pl-6 font-medium text-accent-800"
		>
			<Icon icon="mdi:info" />

			Denna division har inget bracket.

			<Button kind="tertiary" label="Generera" class="ml-auto" onclick={generate}></Button>
		</div>
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Button icon="mdi:trash-can" label="Radera division" kind="negative" onclick={onDeleteDivision} />
</AdminCard>

<EditMatchDialog />
