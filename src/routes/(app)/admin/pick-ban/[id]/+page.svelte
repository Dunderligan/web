<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminEmptyNotice from '$lib/components/admin/AdminEmptyNotice.svelte';
	import Breadcrumbs from '$lib/components/admin/Breadcrumbs.svelte';
	import CreateDialog from '$lib/components/admin/CreateDialog.svelte';
	import SaveToast from '$lib/components/admin/SaveToast.svelte';
	import Checkbox from '$lib/components/form/Checkbox.svelte';
	import InputField from '$lib/components/form/InputField.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import Select from '$lib/components/form/Select.svelte';
	import PickBanConfigField from '$lib/components/pick-ban/PickBanConfigField.svelte';
	import Table from '$lib/components/table/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { resolveConfig } from '$lib/pick-ban/config.js';
	import { PickBanMapType, WinCondition, type MapCatalogEntry } from '$lib/pick-ban/types.js';
	import { updatePickBanConfig } from '$lib/remote/pick-ban-admin.remote.js';
	import { SaveContext } from '$lib/state/save.svelte.js';
	import type { Crumb } from '$lib/types.js';
	import { capitalize, flattenDivision, gamemodeIcon } from '$lib/util.js';

	const { data } = $props();

	SaveContext.set(new SaveContext({ save }));

	const saveCtx = SaveContext.get();

	let config = $state(data.config);

	$effect(() => {
		config = data.config;
	});

	const parentConfigs = $derived(data.parentConfigs);
	const scope = $derived(data.scope);

	let addFixedMapOpen = $state(false);
	let selectedMapId: string | undefined = $state();

	let selectedGamemodeId = $derived(data.gamemodes[0]?.id);

	const resolvedConfig = $derived(resolveConfig(scope, [config, ...parentConfigs], false));

	const crumbs: Crumb[] = $derived.by(() => {
		const crumbs = [];

		if (config.division) {
			const { season, division } = flattenDivision(config.division);

			crumbs.push({ label: season.name, href: `/admin/sasong/${season.id}` });
			crumbs.push({ label: division.name, href: `/admin/division/${division.id}` });
		} else if (config.bracket) {
			crumbs.push({ label: config.bracket.name, href: `/admin/bracket/${config.bracket.id}` });
		}

		crumbs.push({ label: 'Pick-ban', href: `/admin/pick-ban/${config.id}` });

		return crumbs;
	});

	function setMapType(value: PickBanMapType) {
		if (value === PickBanMapType.FIXED) {
			if (resolvedConfig.fixedMapIds === null) {
				config.fixedMapIds = [];
				for (let i = 0; i < resolvedConfig.mapCount; i++) {
					config.fixedMapIds.push(data.maps[i].id);
				}
			}
		}

		config.mapType = value;
	}

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
				config.allowedMapIds = data.maps.filter((map) => map.id !== mapId).map((map) => map.id);
			} else {
				config.allowedMapIds = config.allowedMapIds.filter((id) => id !== mapId);
			}
		}
	}

	async function save() {
		await updatePickBanConfig({
			id: config.id,
			values: config
		});
	}

	function formatWinCondition(condition: WinCondition) {
		switch (condition) {
			case WinCondition.FIXED_MAPS:
				return `Bäst av`;
			case WinCondition.FIRST_TO:
				return `Först till`;
			default:
				return capitalize(condition);
		}
	}
</script>

<Breadcrumbs {crumbs} />

<AdminCard title="Inställningar">
	<PickBanConfigField
		label="Pick-ban aktiverat"
		bind:config
		{resolvedConfig}
		overrideKey="enabled"
		valueKey="enabled"
	>
		{#snippet children({ disabled, value })}
			<Checkbox
				bind:checked={() => value, (v) => (config.enabled = v)}
				{disabled}
				onCheckedChange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>

	<PickBanConfigField
		label="Tillåt att ge första ban"
		bind:config
		{resolvedConfig}
		overrideKey="allowConcedeFirstBan"
		valueKey="allowConcedeFirstBan"
	>
		{#snippet children({ disabled, value })}
			<Checkbox
				bind:checked={() => value, (v) => (config.allowConcedeFirstBan = v)}
				{disabled}
				onCheckedChange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>

	<PickBanConfigField
		label="Beslutstid"
		bind:config
		{resolvedConfig}
		overrideKey="decisionTimeoutSeconds"
		valueKey="decisionTimeoutSeconds"
	>
		{#snippet children({ disabled, value })}
			<InputField
				bind:value={() => value, (v) => (config.decisionTimeoutSeconds = v)}
				placeholder="Antal sekunder"
				type="number"
				{disabled}
				onchange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>

	<PickBanConfigField
		label="Vinstvillkor"
		bind:config
		{resolvedConfig}
		overrideKey="winCondition"
		valueKey="winCondition"
	>
		{#snippet children({ disabled, value })}
			<Select
				class="grow"
				type="single"
				bind:value={() => value, (v) => (config.winCondition = v)}
				items={Object.values(WinCondition).map((condition) => ({
					label: formatWinCondition(condition),
					value: condition
				}))}
				{disabled}
				onValueChange={saveCtx.setDirty}
			/>

			<InputField
				bind:value={() => resolvedConfig.mapCount, (v) => (config.mapCount = v)}
				placeholder="Antal maps"
				type="number"
				{disabled}
				onchange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>
</AdminCard>

<AdminCard title="Kartor">
	<PickBanConfigField
		label="Pooltyp"
		bind:config
		{resolvedConfig}
		overrideKey="mapType"
		valueKey="mapType"
	>
		{#snippet children({ disabled, value })}
			<Select
				type="single"
				class="grow"
				bind:value={() => value, (v) => setMapType(v)}
				{disabled}
				items={Object.values(PickBanMapType).map((type) => ({
					label: capitalize(type),
					value: type
				}))}
				onValueChange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>

	{#if resolvedConfig.mapType === PickBanMapType.FIXED}
		<PickBanConfigField
			label="Kartor"
			bind:config
			{resolvedConfig}
			overrideKey="fixedMapIds"
			valueKey="fixedMapIds"
			fallbackValue={[]}
		/>

		<div>
			{#if !resolvedConfig.fixedMapIds || resolvedConfig.fixedMapIds.length === 0}
				<AdminEmptyNotice oncreateclick={() => (addFixedMapOpen = true)}
					>Det finns inga kartor i den fasta poolen.</AdminEmptyNotice
				>
			{:else}
				<Table
					key={(map) => map.id}
					rows={resolvedConfig.fixedMapIds
						.map((mapId) => data.maps.find((map) => map.id === mapId))
						.filter((map): map is MapCatalogEntry => map !== undefined)}
					kind="transparent"
					columns={[
						{
							label: '#',
							content: (_, index) => index + 1,
							width: '3rem'
						},
						{
							label: 'Karta',
							content: (map) => map.name,
							class: 'text-lg font-semibold'
						},
						{
							snippet: mapActionsCell,
							width: '8rem'
						}
					]}
				/>

				{#snippet mapActionsCell(map: MapCatalogEntry, index: number)}
					<Button
						icon="ph:trash"
						kind="tertiary"
						title="Ta bort"
						onclick={() => {
							config.fixedMapIds = config.fixedMapIds?.filter((id) => id !== map.id) ?? null;
							saveCtx.setDirty();
						}}
					/>

					<Button
						icon="ph:arrow-up"
						kind="tertiary"
						title="Flytta upp"
						disabled={index === 0}
						onclick={() => {
							const idx = config.fixedMapIds?.indexOf(map.id);
							if (idx !== undefined && idx > 0) {
								[config.fixedMapIds[idx - 1], config.fixedMapIds[idx]] = [
									config.fixedMapIds[idx],
									config.fixedMapIds[idx - 1]
								];
							}
							saveCtx.setDirty();
						}}
					/>

					<Button
						icon="ph:arrow-down"
						kind="tertiary"
						title="Flytta ner"
						disabled={index === (config.fixedMapIds?.length ?? 0) - 1}
						onclick={() => {
							const idx = config.fixedMapIds?.indexOf(map.id);
							if (idx !== undefined && idx < (config.fixedMapIds?.length ?? 0) - 1) {
								[config.fixedMapIds[idx + 1], config.fixedMapIds[idx]] = [
									config.fixedMapIds[idx],
									config.fixedMapIds[idx + 1]
								];
							}
							saveCtx.setDirty();
						}}
					/>
				{/snippet}

				<Button icon="ph:plus" label="Lägg till karta" onclick={() => (addFixedMapOpen = true)} />
			{/if}
		</div>
	{:else}
		<PickBanConfigField
			label="Förbjud tidigare spellägen"
			bind:config
			{resolvedConfig}
			overrideKey="restrictUsedGamemodes"
			valueKey="restrictUsedGamemodes"
		>
			{#snippet children({ disabled, value })}
				<Checkbox
					bind:checked={() => value, (v) => (config.restrictUsedGamemodes = v)}
					{disabled}
					onCheckedChange={saveCtx.setDirty}
				/>
			{/snippet}
		</PickBanConfigField>

		<PickBanConfigField
			label="Första spelläget"
			bind:config
			{resolvedConfig}
			overrideKey="setFirstGamemodeId"
			valueKey="firstGamemodeId"
			boolOverride
		>
			{#snippet children({ disabled, value })}
				<Select
					type="single"
					class="grow"
					placeholder="Valfritt spelläge"
					canClear
					{disabled}
					bind:value={() => value ?? undefined, (v) => (config.firstGamemodeId = v ?? null)}
					items={Object.values(data.gamemodes)
						.filter((gm) => gm.active)
						.map((gm) => ({
							label: capitalize(gm.name),
							value: gm.id
						}))}
					onValueChange={saveCtx.setDirty}
				/>
			{/snippet}
		</PickBanConfigField>

		<PickBanConfigField
			label="Tillåtna spellägen"
			bind:config
			{resolvedConfig}
			overrideKey="setAllowedGamemodeIds"
			valueKey="allowedGamemodeIds"
			boolOverride
		>
			{#snippet children({ disabled, value })}
				<Select
					type="multiple"
					class="grow"
					placeholder="Välj spellägen..."
					{disabled}
					bind:value={
						() => value ?? data.gamemodes.filter((gm) => gm.active).map((gm) => gm.id),
						(v) => (config.allowedGamemodeIds = v ?? null)
					}
					items={Object.values(data.gamemodes)
						.filter((gm) => gm.active)
						.map((gm) => ({
							label: capitalize(gm.name),
							value: gm.id
						}))}
					onValueChange={saveCtx.setDirty}
				/>
			{/snippet}
		</PickBanConfigField>

		<PickBanConfigField
			label="Tillåtna kartor"
			bind:config
			{resolvedConfig}
			overrideKey="setAllowedMapIds"
			valueKey="allowedMapIds"
			boolOverride
		/>

		<div>
			<Tabs
				items={data.gamemodes
					.filter((gamemode) => gamemode.active)
					.map((gamemode) => ({
						label: gamemode.name,
						value: gamemode.id,
						icon: gamemodeIcon(gamemode.slug),
						disabled:
							resolvedConfig.allowedGamemodeIds !== null &&
							!resolvedConfig.allowedGamemodeIds.includes(gamemode.id)
					}))}
				bind:selected={selectedGamemodeId}
			/>

			<Table
				key={(map) => map.id}
				rows={data.maps
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
	{/if}
</AdminCard>

<CreateDialog
	title="Lägg till karta"
	bind:open={addFixedMapOpen}
	createLabel="Lägg till"
	oncreate={async () => {
		saveCtx.setDirty();

		config.fixedMapIds ??= [];
		config.fixedMapIds.push(selectedMapId!);

		addFixedMapOpen = false;
		selectedMapId = undefined;
	}}
	disabled={!selectedMapId}
>
	<Label label="Karta">
		<Select
			class="grow"
			type="single"
			placeholder="Välj karta..."
			bind:value={selectedMapId}
			items={data.maps
				.filter((map) => !config.fixedMapIds?.includes(map.id))
				.map((map) => ({
					label: map.name,
					value: map.id
				}))
				.toSorted((a, b) => a.label.localeCompare(b.label))}
		/>
	</Label>
</CreateDialog>

<SaveToast />
