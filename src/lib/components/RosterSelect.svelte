<script lang="ts">
	import { RosterContext } from '$lib/state/rosters.svelte';
	import Select from './Select.svelte';

	type Props = {
		selectedId?: string | null;
		disabled?: boolean;
		onValueChange?: () => void;
	};

	let { selectedId = $bindable(), disabled, onValueChange }: Props = $props();

	const rosters = RosterContext.get();
</script>

<Select
	type="single"
	triggerClass="w-full"
	bind:value={selectedId as string | undefined}
	items={rosters.map
		.values()
		.map((roster) => ({
			label: roster.name,
			value: roster.id
		}))
		.toArray()}
	{disabled}
	{onValueChange}
/>
