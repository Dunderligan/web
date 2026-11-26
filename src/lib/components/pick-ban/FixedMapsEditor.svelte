<script lang="ts">
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import Select from '$lib/components/form/Select.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type {
		GamemodeCatalogEntry,
		MapCatalogEntry,
		PickBanConfigRow,
		ResolvedPickBanConfig
	} from '$lib/pick-ban';
	import { SaveContext } from '$lib/state/save.svelte';
	import { gamemodeIcon } from '$lib/util';

	type Props = {
		config: PickBanConfigRow;
		resolvedConfig: ResolvedPickBanConfig;
		maps: MapCatalogEntry[];
		gamemodes: GamemodeCatalogEntry[];
	};

	let { config = $bindable(), resolvedConfig, maps, gamemodes }: Props = $props();

	const saveCtx = SaveContext.get();

	let addFixedMapOpen = $state(false);
	let selectedMapId: string | undefined = $state();

	const fixedMaps = $derived(
		(resolvedConfig.fixedMapIds ?? [])
			.map((mapId) => maps.find((map) => map.id === mapId))
			.filter((map): map is MapCatalogEntry => map !== undefined)
	);

	const availableMaps = $derived(
		maps
			.filter((map) => !fixedMaps.some((fixedMap) => fixedMap.id === map.id))
			.toSorted((a, b) => a.name.localeCompare(b.name))
	);

	function gamemodeById(gamemodeId: string) {
		return gamemodes.find((gamemode) => gamemode.id === gamemodeId);
	}

	function reorderMaps(from: number, to: number) {
		const reordered = [...fixedMaps];
		const [moved] = reordered.splice(from, 1);
		reordered.splice(to, 0, moved);

		config.fixedMapIds = reordered.map((map) => map.id);
		saveCtx.setDirty();
	}

	function addMap() {
		config.fixedMapIds ??= [];
		config.fixedMapIds.push(selectedMapId!);

		addFixedMapOpen = false;
		selectedMapId = undefined;

		saveCtx.setDirty();
	}
</script>

<div>
	{#if !resolvedConfig.fixedMapIds || resolvedConfig.fixedMapIds.length === 0}
		<AdminEmptyNotice
			hideCreateButton={config.fixedMapIds === null}
			oncreateclick={() => (addFixedMapOpen = true)}
			>Inga kartor har lagts till i kartpoolen.</AdminEmptyNotice
		>
	{:else}
		<Table
			key={(map) => map.id}
			rows={fixedMaps}
			onreorder={reorderMaps}
			kind="transparent"
			columns={[
				{
					snippet: dragHandleCell,
					width: '3rem'
				},
				{
					label: '#',
					content: (map: MapCatalogEntry, index: number) => index + 1,
					width: '2rem'
				},
				{
					label: 'Karta',
					snippet: mapNameCell
				},
				{
					snippet: mapActionsCell,
					width: '5rem'
				}
			]}
		/>

		{#snippet dragHandleCell()}
			<Icon icon="ph:dots-six-vertical" title="Dra för att ändra ordning" />
		{/snippet}

		{#snippet mapNameCell(map: MapCatalogEntry)}
			{@const gamemode = gamemodeById(map.gamemodeId)}
			{#if gamemode}
				<Icon icon={gamemodeIcon(gamemode.slug)} title={gamemode.name} class="mr-2" />
			{/if}

			<span class="text-lg font-semibold">{map.name}</span>
		{/snippet}

		{#snippet mapActionsCell(map: MapCatalogEntry)}
			<Button
				icon="ph:trash"
				kind="tertiary"
				title="Ta bort"
				onclick={() => {
					config.fixedMapIds = config.fixedMapIds?.filter((id) => id !== map.id) ?? null;
					saveCtx.setDirty();
				}}
			/>
		{/snippet}

		<Button
			icon="ph:plus"
			class="mt-2"
			label="Lägg till karta"
			onclick={() => (addFixedMapOpen = true)}
		/>
	{/if}
</div>

<CreateDialog
	title="Lägg till karta"
	bind:open={addFixedMapOpen}
	createLabel="Lägg till"
	oncreate={async () => addMap()}
	disabled={!selectedMapId}
>
	<Label label="Karta">
		<Select
			class="grow"
			type="single"
			placeholder="Välj karta..."
			bind:value={selectedMapId}
			items={availableMaps.map((map) => ({
				label: map.name,
				value: map.id
			}))}
		/>
	</Label>
</CreateDialog>
