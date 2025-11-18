<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import AdminLink from '$lib/components/admin/AdminLink.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import EditableMatch from '$lib/components/match/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/match/EditMatchDialog.svelte';
	import InputField from '$lib/components/ui/InputField.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import type { FullMatch } from '$lib/types';
	import { buildBracket } from '$lib/util';
	import {
		createGroup,
		deleteBracket,
		deleteDivision,
		generateBracket,
		updateDivision
	} from './page.remote';

	const { data } = $props();

	const division = $state(data.division);
	const season = $state(division.season);

	RosterContext.set(new RosterContext(data.division.groups.flatMap((group) => group.rosters)));
	SaveContext.set(new SaveContext({ save, href: `/sasong/${season.slug}?div=${division.slug}` }));

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	let createGroupOpen = $state(false);
	let newGroupName = $state('');

	async function submitDelete() {
		await confirmCtx.confirm({
			title: 'Radera division',
			description: `Är du säker på att du vill radera ${division.name}, ${season.name}?`,
			negative: true,
			action: async () => {
				await deleteDivision({
					id: division.id
				});

				await goto(`/admin/sasong/${season.id}`);
			}
		});
	}

	async function submitNewGroup() {
		const { group } = await createGroup({
			name: newGroupName,
			divisionId: division.id
		});

		await goto(`/admin/grupp/${group.id}`);
	}

	let rounds: FullMatch[][] = $state([]);

	async function generate() {
		const result = await generateBracket({
			divisionId: division.id
		});

		rounds = result.rounds;
	}

	async function save() {
		await updateDivision({
			id: division.id,
			name: division.name,
			bracketMatches: rounds.flatMap((round) => round)
		});
	}

	async function onDeleteBracket() {
		await deleteBracket({
			divisionId: division.id
		});

		rounds = [];
	}

	$effect(() => {
		rounds = buildBracket(data.matches);
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
		{ label: division.name, href: `/admin/division/${division.id}` }
	]}
/>

<AdminCard title="Grupper">
	{#if division.groups.length === 0}
		<AdminEmptyNotice oncreateclick={() => (createGroupOpen = true)}>
			Denna division har inga grupper.
		</AdminEmptyNotice>
	{:else}
		<div class="space-y-1 overflow-hidden rounded-lg">
			{#each division.groups as { id, name } (id)}
				<AdminLink href="/admin/grupp/{id}">
					{name}
				</AdminLink>
			{/each}
		</div>

		<Button icon="ph:plus" onclick={() => (createGroupOpen = true)} />
	{/if}
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

		<Button icon="ph:trash" label="Radera bracket" kind="negative" onclick={onDeleteBracket} />
	{:else}
		<Notice kind="info">
			Denna division har inget bracket.

			<Button kind="transparent" icon="ph:plus" label="Generera" class="ml-auto" onclick={generate}
			></Button>
		</Notice>
	{/if}
</AdminCard>

<AdminCard title="Inställningar">
	<Label label="Namn">
		<InputField bind:value={division.name} oninput={saveCtx.setDirty} />
	</Label>

	<Button icon="ph:trash" label="Radera division" kind="negative" onclick={submitDelete} />
</AdminCard>

<EditMatchDialog />

<CreateDialog
	title="Skapa grupp"
	bind:open={createGroupOpen}
	oncreate={submitNewGroup}
	onclose={() => {
		newGroupName = '';
	}}
	disabled={!newGroupName}
>
	<Label label="Namn">
		<InputField bind:value={newGroupName} placeholder="T.ex. Grupp A..." />
	</Label>
</CreateDialog>

<SaveToast />
