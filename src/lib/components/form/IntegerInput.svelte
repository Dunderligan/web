<script lang="ts" generics="EmptyAsNull extends boolean = false">
	import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';

	/** If EmptyAsNull is true, make our value and onValueChange handle null values. */
	type Value = number | (EmptyAsNull extends true ? null : never);

	type Props = {
		value: Value;
		onValueChange?: (value: Value) => void;
		disabled?: boolean;
		class?: ClassValue;
		min?: number;
		/** Treat an empty input as null. */
		emptyAsNull?: EmptyAsNull;
	} & Omit<
		HTMLInputAttributes,
		'onchange' | 'oninput' | 'onfocus' | 'onblur' | 'type' | 'step' | 'value'
	>;

	let {
		value = $bindable(),
		onValueChange,
		min,
		class: classProp,
		emptyAsNull,
		...props
	}: Props = $props();

	/**
	 * The value being edited, or `null` when the input is not focused and should
	 * display the bound value. An empty draft is a transient state and is never
	 * committed.
	 */
	let draft = $state<string | null>(null);

	const displayValue = $derived(draft ?? String(value));

	function oninput(event: Event & { currentTarget: HTMLInputElement }) {
		draft = event.currentTarget.value;

		if (draft === '' && emptyAsNull) {
			value = null as Value;
			onValueChange?.(null as Value);
			return;
		}

		const parsed = Number(draft);
		if (
			draft !== '' &&
			Number.isInteger(parsed) &&
			(min === undefined || parsed >= min) &&
			parsed !== value
		) {
			value = parsed;
			onValueChange?.(parsed);
		}
	}

	function onblur() {
		draft = null;
	}
</script>

<input
	type="number"
	step="1"
	class={[classProp, 'field min-w-0 grow']}
	value={displayValue}
	{min}
	onfocus={() => (draft = String(value))}
	{onblur}
	{oninput}
	{...props}
/>
