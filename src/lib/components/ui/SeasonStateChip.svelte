<script lang="ts">
	import type { ChipColor, SeasonState } from '$lib/types';
	import Chip from './Chip.svelte';

	type Props = { state: SeasonState };

	let { state }: Props = $props();

	const { color, icon, label } = $derived(
		{
			upcoming: {
				color: 'yellow',
				icon: 'ph:calendar-blank',
				label: 'Kommande'
			},
			ongoing: {
				color: 'green',
				icon: 'ph:circle',
				label: 'Pågående'
			},
			ended: {
				color: 'gray',
				icon: 'ph:check',
				label: 'Avslutad'
			}
		}[state]
	);
</script>

<Chip color={color as ChipColor} {icon} {label} />
