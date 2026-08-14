<script lang="ts">
	import type { ChipColor, SubmissionStatus } from '$lib/types';
	import Chip from '../ui/Chip.svelte';

	type Props = {
		status: SubmissionStatus;
	};

	let { status }: Props = $props();

	const { icon, label, color } = $derived(
		{
			approved: { icon: 'ph:check-circle', label: 'Godkänd', color: 'green' },
			rejected: { icon: 'ph:x-circle', label: 'Nekad', color: 'red' },
			pending: { icon: 'ph:hourglass', label: 'Väntar', color: 'yellow' }
		}[status] as { icon: string; label: string; color: ChipColor }
	);
</script>

<Chip {icon} {label} {color} />
