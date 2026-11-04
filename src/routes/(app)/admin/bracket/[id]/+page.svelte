<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EditableMatch from '$lib/components/match/EditableMatch.svelte';
	import EditMatchDialog from '$lib/components/match/EditMatchDialog.svelte';
	import InputField from '$lib/components/form/InputField.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import { ConfirmContext } from '$lib/state/confirm.svelte';
	import { RosterContext } from '$lib/state/rosters.svelte';
	import { SaveContext } from '$lib/state/save.svelte';
	import { BracketFormat, type UnresolvedMatchWithOrder } from '$lib/types';
	import { buildBracketStructure, propagateBracket, type BracketStructure } from '$lib/bracket';
	import { deleteBracket, updateBracket } from '$lib/remote/bracket.remote';
	import { isAdmin } from '$lib/auth-role.js';

	const { data } = $props();

	// svelte-ignore state_referenced_locally
	let bracket = $state(data.bracket);

	$effect(() => {
		bracket = data.bracket;
	});

	const division = $derived(data.division);
	const season = $derived(division.season);

	RosterContext.set(
		new RosterContext({
			onMatchEdit: () => {
				propagateBracket(bracket.matches);
			}
		})
	);
	SaveContext.set(
		new SaveContext({
			save,
			href: () => `/stallningar/${season.slug}?div=${division.slug}&visa=slutspel`
		})
	);

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	const rosterCtx = RosterContext.get();

	$effect(() => {
		rosterCtx.setRosters(data.rosters);
	});

	// we can't use derived here as we need deep reactivity to make sure
	// the root match objects are actually edited, not just local copies in `structure`
	let structure: BracketStructure<UnresolvedMatchWithOrder> = $state({
		upper: [],
		lower: [],
		grandFinal: []
	});

	$effect(() => {
		structure = buildBracketStructure(bracket.matches);
	});

	async function onDeleteClicked() {
		await confirmCtx.confirm({
			title: 'Radera bracket',
			description: `Är du säker på att du vill radera bracket ${bracket.name ?? division.name}, ${season.name}?`,
			destructive: true,
			action: async () => {
				await deleteBracket({
					id: bracket.id
				});

				await goto(resolve(`/admin/division/${division.id}`));
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
</script>

<Breadcrumbs
	crumbs={[
		{ label: season.name, href: `/admin/sasong/${season.id}` },
		{ label: division.name, href: `/admin/division/${division.id}` },
		{ label: bracket.name ?? 'Bracket', href: `/admin/bracket/${bracket.id}` }
	]}
/>

{#snippet bracketSection(
	title: string,
	rounds: UnresolvedMatchWithOrder[][],
	canEditRosters: boolean
)}
	<AdminCard {title}>
		<div class="flex items-stretch gap-4 overflow-x-auto">
			{#each rounds as round, i (i)}
				<div class="flex w-full min-w-60 flex-col justify-around gap-4">
					{#each round as match (match.id)}
						<EditableMatch {match} canDelete={false} canEditRosters={canEditRosters && i === 0} />
					{/each}
				</div>
			{/each}
		</div>
	</AdminCard>
{/snippet}

{#if bracket.format === BracketFormat.DOUBLE_ELIMINATION}
	{@render bracketSection('Övre bracket', structure.upper, true)}
	{@render bracketSection('Nedre bracket', structure.lower, false)}
	{@render bracketSection('Final', [structure.grandFinal], false)}
{:else}
	{@render bracketSection('Bracket', structure.upper, true)}
{/if}

{#if isAdmin(data.user?.role)}
	<AdminCard title="Inställningar">
		<div class="space-y-2">
			<Label label="Namn">
				<InputField bind:value={bracket.name} oninput={saveCtx.setDirty} />
			</Label>
		</div>

		<Button icon="ph:trash" label="Radera bracket" kind="destructive" onclick={onDeleteClicked} />
	</AdminCard>
{/if}

<EditMatchDialog />

<SaveToast />
