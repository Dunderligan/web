<script
	lang="ts"
	generics="OverrideKey extends keyof PickBanConfigRow, 
  ResolvedValueKey extends keyof ResolvedPickBanConfig"
>
	import type { PickBanConfigRow, ResolvedPickBanConfig } from '$lib/pick-ban';
	import type { Snippet } from 'svelte';
	import Checkbox from '../form/Checkbox.svelte';
	import Label from '../form/Label.svelte';
	import { SaveContext } from '$lib/state/save.svelte';

	type T = ResolvedPickBanConfig[ResolvedValueKey];

	type Props = {
		label: string;
		config: PickBanConfigRow;
		resolvedConfig: ResolvedPickBanConfig;
		overrideKey: OverrideKey;
		valueKey: ResolvedValueKey;
		boolOverride?: boolean;
		fallbackValue?: T;
		children?: Snippet<[{ disabled: boolean; value: T }]>;
		column?: boolean;
		fullWidth?: boolean;
	};

	let {
		label: labelText,
		config = $bindable(),
		resolvedConfig,
		overrideKey,
		valueKey,
		boolOverride = false,
		fallbackValue,
		children,
		column,
		fullWidth
	}: Props = $props();

	const saveCtx = SaveContext.get();

	const value: T = $derived(resolvedConfig[valueKey]);

	const overriden = $derived.by(() => {
		if (boolOverride) {
			return config[overrideKey] === true;
		} else {
			return config[overrideKey] !== null;
		}
	});

	function setOverriden(value: boolean) {
		if (boolOverride) {
			config[overrideKey] = value as PickBanConfigRow[OverrideKey];
		} else {
			config[overrideKey] = (
				value ? (fallbackValue ?? resolvedConfig[valueKey]) : null
			) as PickBanConfigRow[OverrideKey];
		}
		saveCtx.setDirty();
	}
</script>

<div class="flex items-center gap-2">
	<Checkbox bind:checked={() => overriden, (overriden) => setOverriden(overriden)} />

	<Label {column} {fullWidth} label={labelText} class="grow">
		{@render children?.({ disabled: !overriden, value })}
	</Label>
</div>
