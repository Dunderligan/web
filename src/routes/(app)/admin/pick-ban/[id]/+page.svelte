<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AdminCard from '#lib/components/admin/AdminCard.svelte';
	import Breadcrumbs from '#lib/components/admin/Breadcrumbs.svelte';
	import SaveToast from '#lib/components/admin/SaveToast.svelte';
	import Checkbox from '#lib/components/form/Checkbox.svelte';
	import IntegerInput from '#lib/components/form/IntegerInput.svelte';
	import Select from '#lib/components/form/Select.svelte';
	import AllowedMapsPicker from '#lib/components/pick-ban/AllowedMapsPicker.svelte';
	import FixedMapsEditor from '#lib/components/pick-ban/FixedMapsEditor.svelte';
	import PickBanConfigField from '#lib/components/pick-ban/PickBanConfigField.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Notice from '#lib/components/ui/Notice.svelte';
	import { PickBanConfigError, resolveConfig, validateConfig } from '#lib/pick-ban/config.js';
	import { PickBanMapType, WinCondition } from '#lib/pick-ban/types.js';
	import { deletePickBanConfig, updatePickBanConfig } from '#lib/remote/pick-ban-admin.remote.js';
	import { ConfirmContext } from '#lib/state/confirm.svelte.js';
	import { SaveContext } from '#lib/state/save.svelte.js';
	import type { Crumb } from '#lib/types.js';
	import { capitalize, flattenDivision } from '#lib/util.js';

	const { data } = $props();

	SaveContext.set(new SaveContext({ save }));

	const saveCtx = SaveContext.get();
	const confirmCtx = ConfirmContext.get();

	// svelte-ignore state_referenced_locally
	let config = $state(data.config);

	$effect(() => {
		config = data.config;
	});

	const parentConfigs = $derived(data.parentConfigs);
	const scope = $derived(data.scope);

	const resolvedConfig = $derived(resolveConfig(scope, [config, ...parentConfigs], false));

	const configErrorMessages: Record<PickBanConfigError, string> = {
		[PickBanConfigError.INVALID_MAP_COUNT]: 'Antalet maps måste vara ett positivt heltal.',
		[PickBanConfigError.INVALID_DECISION_TIMEOUT]: 'Beslutstiden måste vara ett positivt heltal.',
		[PickBanConfigError.EMPTY_ALLOWED_MAPS]: 'Det måste finnas minst en tillåten karta..',
		[PickBanConfigError.DUPLICATE_ALLOWED_MAPS]: 'Tillåtna kartor innehåller dubbletter.',
		[PickBanConfigError.EMPTY_ALLOWED_GAMEMODES]: 'Det måste finnas minst ett tillåtet spelläge.',
		[PickBanConfigError.DUPLICATE_ALLOWED_GAMEMODES]: 'Tillåtna spellägen innehåller dubbletter.',
		[PickBanConfigError.MISSING_FIXED_MAPS]: 'Kartpoolen måste innehålla minst en karta.',
		[PickBanConfigError.DUPLICATE_FIXED_MAPS]: 'Den fasta kartpoolen innehåller dubbletter.'
	};

	const validateError = $derived(validateConfig(resolvedConfig));

	const crumbs = $derived.by(() => {
		const crumbs: Crumb[] = [];

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

	async function save() {
		await updatePickBanConfig({
			id: config.id,
			values: config
		});
	}

	function onDeleteClick() {
		confirmCtx.confirm({
			title: 'Radera pick-ban-konfiguration',
			description:
				'Är du säker på att du vill radera denna pick-ban-konfiguration? Denna åtgärd kan inte ångras.',
			destructive: true,
			action: async () => {
				await deletePickBanConfig({ id: config.id });

				let redirectUrl = resolve('admin');
				if (config.division) {
					redirectUrl = resolve(`admin/division/${config.division.id}`);
				} else if (config.bracket) {
					redirectUrl = resolve(`admin/bracket/${config.bracket.id}`);
				}

				await goto(redirectUrl);
			}
		});
	}

	function formatWinCondition(condition: WinCondition) {
		switch (condition) {
			case WinCondition.FIXED_MAPS:
				return `Bäst av`;
			case WinCondition.FIRST_TO:
				return `Först till`;
		}
	}

	function formatMapType(type: PickBanMapType) {
		switch (type) {
			case PickBanMapType.FIXED:
				return 'Fast kartordning';
			case PickBanMapType.POOL:
				return 'Väljs av lagen';
		}
	}
</script>

<Breadcrumbs {crumbs} />

{#if validateError}
	<Notice kind="error" class="mb-4">
		<p class="font-semibold">Konfigurationen är ogiltig:</p>
		<p>{configErrorMessages[validateError]}</p>
	</Notice>
{/if}

<AdminCard title="Kartor">
	<PickBanConfigField
		label="Kartval"
		bind:config
		{resolvedConfig}
		overrideKey="mapType"
		valueKey="mapType"
	>
		{#snippet children({ disabled, value })}
			<Select
				type="single"
				class="grow"
				bind:value={() => value, (v) => (config.mapType = v)}
				{disabled}
				items={Object.values(PickBanMapType).map((type) => ({
					label: formatMapType(type),
					value: type
				}))}
				onValueChange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>

	{#if resolvedConfig.mapType === PickBanMapType.FIXED}
		<PickBanConfigField
			label="Förutbestämd ordning"
			bind:config
			{resolvedConfig}
			overrideKey="fixedMapIds"
			valueKey="fixedMapIds"
			fallbackValue={[]}
		/>

		<FixedMapsEditor bind:config {resolvedConfig} maps={data.maps} gamemodes={data.gamemodes} />
	{:else}
		<PickBanConfigField
			label="Förbjud upprepade spellägen"
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

		<AllowedMapsPicker bind:config {resolvedConfig} gamemodes={data.gamemodes} maps={data.maps} />
	{/if}
</AdminCard>

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
		label="Tillåt att överlåta första ban"
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
			<IntegerInput
				bind:value={() => value, (v) => (config.decisionTimeoutSeconds = v)}
				placeholder="Antal sekunder"
				{disabled}
				onValueChange={saveCtx.setDirty}
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

			<IntegerInput
				bind:value={() => resolvedConfig.mapCount, (v) => (config.mapCount = v)}
				placeholder="Antal kartor"
				{disabled}
				onValueChange={saveCtx.setDirty}
			/>
		{/snippet}
	</PickBanConfigField>

	<Button kind="destructive" label="Radera konfiguration" icon="ph:trash" onclick={onDeleteClick} />
</AdminCard>

<SaveToast />
