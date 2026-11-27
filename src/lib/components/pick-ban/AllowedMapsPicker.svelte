<script lang="ts">
	import Checkbox from '#lib/components/form/Checkbox.svelte';
	import Table from '#lib/components/table/Table.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Tabs from '#lib/components/ui/Tabs.svelte';
	import type {
		GamemodeCatalogEntry,
		MapCatalogEntry,
		PickBanConfigRow,
		ResolvedPickBanConfig
	} from '#lib/pick-ban/index.ts';
	import { SaveContext } from '#lib/state/save.svelte.ts';
	import type { TabItem } from '#lib/types.ts';
	import { gamemodeIcon } from '#lib/util.ts';

	type Props = {
		config: PickBanConfigRow;
		resolvedConfig: ResolvedPickBanConfig;
		gamemodes: GamemodeCatalogEntry[];
		maps: MapCatalogEntry[];
	};

	let { config = $bindable(), resolvedConfig, gamemodes, maps }: Props = $props();

	const saveCtx = SaveContext.get();

	let selectedGamemodeId = $derived(gamemodes[0]?.id);

	const gamemodeTabItems: TabItem<string>[] = $derived(
		gamemodes
			.filter((gamemode) => gamemode.active)
			.map((gamemode) => ({
				label: gamemode.name,
				value: gamemode.id,
				icon: gamemodeIcon(gamemode.slug),
				disabled:
					resolvedConfig.allowedGamemodeIds !== null &&
					!resolvedConfig.allowedGamemodeIds.includes(gamemode.id)
			}))
	);

	const allowedMapSet = $derived(new Set(resolvedConfig.allowedMapIds ?? []));

	function isMapAllowed(mapId: string) {
		if (!resolvedConfig.allowedMapIds) {
			return true;
		}

		return allowedMapSet.has(mapId);
	}

	function setMapAllowed(mapId: string, allowed: boolean) {
		if (allowed) {
			config.allowedMapIds ??= [];
			config.allowedMapIds.push(mapId);
		} else {
			if (config.allowedMapIds === null) {
				config.allowedMapIds = maps.filter((map) => map.id !== mapId).map((map) => map.id);
			} else {
				config.allowedMapIds = config.allowedMapIds.filter((id) => id !== mapId);
			}
		}
	}
</script>

<div>
	<Tabs items={gamemodeTabItems} bind:selected={selectedGamemodeId} />

	<Table
		key={(map) => map.id}
		rows={maps
			.filter((map) => map.gamemodeId === selectedGamemodeId)
			.toSorted((a, b) => a.name.localeCompare(b.name))}
		kind="transparent"
		class="mt-2"
		columns={[
			{
				label: 'Karta',
				content: (map) => map.name,
				class: 'text-lg font-semibold',
				width: '1/2'
			},
			{
				label: 'Tillåten',
				snippet: mapAllowedCell,
				width: '1/2'
			}
		]}
	/>

	{#snippet mapAllowedCell(map: MapCatalogEntry)}
		<Checkbox
			disabled={!config.setAllowedMapIds}
			bind:checked={() => isMapAllowed(map.id), (value) => setMapAllowed(map.id, value)}
			onCheckedChange={saveCtx.setDirty}
		/>
	{/snippet}

	<div class="mt-2 flex items-center gap-2">
		<Button
			label="Tillåt alla"
			kind="secondary"
			onclick={() => {
				config.allowedMapIds = null;
				saveCtx.setDirty();
			}}
			disabled={!config.setAllowedMapIds}
		/>
		<Button
			label="Tillåt inga"
			kind="secondary"
			onclick={() => {
				config.allowedMapIds = [];
				saveCtx.setDirty();
			}}
			disabled={!config.setAllowedMapIds}
		/>
	</div>
</div>
