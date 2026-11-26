<script lang="ts">
	import { PickBanMapType, WinCondition, type MapCatalogEntry } from '$lib/pick-ban';
	import { PickBanContext } from '$lib/state/pick-ban.svelte';
	import type { Snippet } from 'svelte';
	import Dialog from '../ui/Dialog.svelte';

	type Props = {
		open: boolean;
	};

	let { open = $bindable(false) }: Props = $props();

	const context = PickBanContext.get();

	const config = $derived(context.config);
	const isFixed = $derived(config.mapType === PickBanMapType.FIXED);

	const winConditionLabel = $derived.by(() => {
		const mapCount = config.mapCount;

		if (config.winCondition === WinCondition.FIRST_TO) {
			return `Först till ${mapCount} ${mapCount === 1 ? 'karta' : 'kartor'}`;
		}

		return `Bäst av ${mapCount} ${mapCount === 1 ? 'karta' : 'kartor'}`;
	});

	const timeoutLabel = $derived(
		`${config.decisionTimeoutSeconds} ${config.decisionTimeoutSeconds === 1 ? 'sekund' : 'sekunder'}`
	);

	const allowedMaps = $derived.by(() => {
		if (!config.allowedMapIds) return null;

		const allowed = new Set(config.allowedMapIds);
		return context.catalog.maps.filter((map) => allowed.has(map.id));
	});

	const allowedGamemodes = $derived.by(() => {
		if (!config.allowedGamemodeIds) return null;

		const allowed = new Set(config.allowedGamemodeIds);
		return context.gamemodes.filter((gamemode) => allowed.has(gamemode.id));
	});

	const firstGamemode = $derived(
		config.firstGamemodeId
			? (context.gamemodes.find((gamemode) => gamemode.id === config.firstGamemodeId) ?? null)
			: null
	);

	const fixedMaps = $derived.by(() => {
		if (!config.fixedMapIds) return [];

		const mapsById = new Map(context.catalog.maps.map((map) => [map.id, map]));
		return config.fixedMapIds
			.map((mapId) => mapsById.get(mapId))
			.filter((map): map is MapCatalogEntry => map !== undefined);
	});
</script>

{#snippet row(label: string, value: string | Snippet)}
	<div class="flex justify-between gap-x-4 gap-y-1 py-2.5 not-sm:flex-col">
		<dt class="font-semibold text-gray-500 dark:text-gray-400">{label}</dt>
		<dd class="font-medium text-gray-800 dark:text-gray-200">
			{#if typeof value === 'string'}
				{value}
			{:else}
				{@render value()}
			{/if}
		</dd>
	</div>
{/snippet}

{#snippet nameList(names: string[], emptyLabel: string)}
	{#if names.length > 0}
		<span class="inline-flex flex-wrap justify-end gap-1">
			{#each names as name (name)}
				<span class="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">{name}</span>
			{/each}
		</span>
	{:else}
		{emptyLabel}
	{/if}
{/snippet}

<Dialog bind:open title="Info" wide>
	<dl class="divide-y divide-gray-100 dark:divide-gray-800">
		{@render row('Vinstvillkor', winConditionLabel)}
		{@render row('Kartpool', isFixed ? 'Förutbestämda kartor' : 'Väljs av lagen')}
		{@render row('Beslutstid', timeoutLabel)}
		{@render row(
			'Första ban',
			config.allowConcedeFirstBan ? 'Kan överlåtas' : 'Kan inte överlåtas'
		)}

		{#if isFixed}
			{@render row('Kartordning', fixedMapsList)}

			{#snippet fixedMapsList()}
				{#if fixedMaps.length > 0}
					<ol class="flex flex-wrap gap-1.5">
						{#each fixedMaps as map, index (map.id)}
							<li
								class="flex items-center gap-1.5 rounded bg-gray-100 px-2 py-0.5 text-sm font-medium dark:bg-gray-800"
							>
								<span class="text-gray-500 dark:text-gray-400">{index + 1}.</span>
								{map.name}
							</li>
						{/each}
					</ol>
				{:else}
					Inga kartor konfigurerade
				{/if}
			{/snippet}
		{:else}
			{@render row('Tillåtna kartor', allowedMapsList)}

			{#snippet allowedMapsList()}
				{#if allowedMaps}
					{@render nameList(
						allowedMaps.map((map) => map.name),
						'Inga kartor tillåtna'
					)}
				{:else}
					Alla aktiva kartor
				{/if}
			{/snippet}

			{@render row('Tillåtna spellägen', allowedGamemodesList)}

			{#snippet allowedGamemodesList()}
				{#if allowedGamemodes}
					{@render nameList(
						allowedGamemodes.map((gamemode) => gamemode.name),
						'Inga spellägen tillåtna'
					)}
				{:else}
					Alla aktiva spellägen
				{/if}
			{/snippet}

			{@render row(
				'Återanvända spellägen',
				config.restrictUsedGamemodes ? 'Får inte väljas igen' : 'Får väljas igen'
			)}
			{@render row('Första spelläget', firstGamemode?.name ?? 'Valfritt')}
		{/if}
	</dl>
</Dialog>
